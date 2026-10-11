// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 1 ) @group( 1 ) var nodeUniform11_sampler : sampler;
@binding( 2 ) @group( 1 ) var nodeUniform11 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform24_sampler : sampler_comparison;
@binding( 4 ) @group( 1 ) var nodeUniform24 : texture_depth_2d;

struct objectStruct {
	nodeUniform1 : mat4x4<f32>,
	nodeUniform2 : f32,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform6 : f32,
	nodeUniform7 : f32,
	nodeUniform8 : f32,
	nodeUniform9 : vec3<f32>,
	nodeUniform10 : f32,
	nodeUniform32 : vec3<f32>,
	nodeUniform33 : vec3<f32>,
	nodeUniform35 : vec3<f32>,
	nodeUniform36 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform20 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform30 : f32,
	nodeUniform31 : f32,
	nodeUniform15 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform19 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform21 : mat4x4<f32>,
	nodeUniform22 : f32,
	nodeUniform23 : f32,
	nodeUniform27 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform25 : f32,
	nodeUniform26 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : u32;
var<private> nodeVar4 : u32;
var<private> nodeVar5 : u32;
var<private> nodeVar6 : u32;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : f32;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : u32;
var<private> nodeVar12 : u32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : f32;
var<private> nodeVar17 : u32;
var<private> nodeVar18 : u32;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : u32;
var<private> nodeVar24 : u32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : u32;
var<private> nodeVar28 : u32;
var<private> nodeVar29 : u32;
var<private> nodeVar30 : u32;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : u32;
var<private> nodeVar35 : u32;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : u32;
var<private> nodeVar39 : u32;
var<private> nodeVar40 : u32;
var<private> nodeVar41 : u32;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> nodeVar44 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : vec2<f32>;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : f32;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : vec4<f32>;
var<private> nodeVar60 : vec4<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : vec3<f32>;
var<private> nodeVar65 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : f32;
var<private> nodeVar72 : f32;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : f32;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec4<f32>;
var<private> nodeVar88 : vec4<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : vec4<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : vec2<f32>;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : vec2<f32>;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : vec2<f32>;
var<private> nodeVar103 : f32;
var<private> nodeVar104 : vec2<f32>;
var<private> nodeVar105 : f32;
var<private> nodeVar106 : vec2<f32>;
var<private> nodeVar107 : f32;
var<private> nodeVar108 : f32;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : f32;
var<private> nodeVar116 : f32;
var<private> nodeVar117 : f32;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : f32;
var<private> nodeVar125 : f32;
var<private> nodeVar126 : f32;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : f32;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : f32;
var<private> nodeVar137 : f32;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : f32;
var<private> nodeVar146 : f32;
var<private> nodeVar147 : f32;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : f32;
var<private> nodeVar155 : f32;
var<private> nodeVar156 : f32;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : f32;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : f32;
var<private> nodeVar173 : f32;
var<private> nodeVar174 : f32;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : f32;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : f32;
var<private> nodeVar199 : f32;
var<private> nodeVar200 : f32;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : f32;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : f32;
var<private> nodeVar217 : f32;
var<private> nodeVar218 : f32;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : f32;
var<private> nodeVar242 : f32;
var<private> nodeVar243 : f32;
var<private> nodeVar244 : f32;
var<private> nodeVar245 : f32;
var<private> nodeVar246 : f32;
var<private> nodeVar247 : f32;
var<private> nodeVar248 : f32;
var<private> nodeVar249 : f32;
var<private> nodeVar250 : f32;
var<private> nodeVar251 : f32;
var<private> nodeVar252 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar255 : vec3<f32>;
var<private> nodeVar256 : f32;
var<private> nodeVar257 : vec4<f32>;

// codes
fn mx_floor ( x : f32 ) -> i32 {

	var nodeVar0 : f32;

	nodeVar0 = x;

	return i32( floor( nodeVar0 ) );

}


fn mx_fade ( t : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = t;

	return ( ( ( nodeVar0 * nodeVar0 ) * nodeVar0 ) * ( ( nodeVar0 * ( ( nodeVar0 * 6.0 ) - 15.0 ) ) + 10.0 ) );

}


fn mx_rotl32 ( x : u32, k : i32 ) -> u32 {

	var nodeVar0 : i32;
	var nodeVar1 : u32;

	nodeVar0 = k;
	nodeVar1 = x;

	return ( ( nodeVar1 << u32( nodeVar0 ) ) | ( nodeVar1 >> u32( ( 32 - nodeVar0 ) ) ) );

}


fn mx_bjfinal ( a : u32, b : u32, c : u32 ) -> u32 {

	var nodeVar0 : u32;
	var nodeVar1 : u32;
	var nodeVar2 : u32;

	nodeVar0 = c;
	nodeVar1 = b;
	nodeVar2 = a;
	nodeVar0 = ( nodeVar0 ^ nodeVar1 );
	nodeVar0 = ( nodeVar0 - mx_rotl32( nodeVar1, 14 ) );
	nodeVar2 = ( nodeVar2 ^ nodeVar0 );
	nodeVar2 = ( nodeVar2 - mx_rotl32( nodeVar0, 11 ) );
	nodeVar1 = ( nodeVar1 ^ nodeVar2 );
	nodeVar1 = ( nodeVar1 - mx_rotl32( nodeVar2, 25 ) );
	nodeVar0 = ( nodeVar0 ^ nodeVar1 );
	nodeVar0 = ( nodeVar0 - mx_rotl32( nodeVar1, 16 ) );
	nodeVar2 = ( nodeVar2 ^ nodeVar0 );
	nodeVar2 = ( nodeVar2 - mx_rotl32( nodeVar0, 4 ) );
	nodeVar1 = ( nodeVar1 ^ nodeVar2 );
	nodeVar1 = ( nodeVar1 - mx_rotl32( nodeVar2, 14 ) );
	nodeVar0 = ( nodeVar0 ^ nodeVar1 );
	nodeVar0 = ( nodeVar0 - mx_rotl32( nodeVar1, 24 ) );

	return nodeVar0;

}


fn mx_hash_int_2 ( x : i32, y : i32, z : i32 ) -> u32 {

	var nodeVar0 : i32;
	var nodeVar1 : i32;
	var nodeVar2 : i32;
	var nodeVar3 : u32;
	var nodeVar4 : u32;
	var nodeVar5 : u32;
	var nodeVar6 : u32;

	nodeVar0 = z;
	nodeVar1 = y;
	nodeVar2 = x;
	nodeVar3 = 3u;
	nodeVar4 = 0u;
	nodeVar5 = 0u;
	nodeVar6 = 0u;
	nodeVar6 = ( ( 3735928559u + ( nodeVar3 << 2u ) ) + 13u );
	nodeVar5 = nodeVar6;
	nodeVar4 = nodeVar5;
	nodeVar4 = ( nodeVar4 + u32( nodeVar2 ) );
	nodeVar5 = ( nodeVar5 + u32( nodeVar1 ) );
	nodeVar6 = ( nodeVar6 + u32( nodeVar0 ) );

	return mx_bjfinal( nodeVar4, nodeVar5, nodeVar6 );

}


fn mx_select ( b : bool, t : f32, f : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;
	var nodeVar2 : bool;
	var nodeVar3 : f32;

	nodeVar0 = f;
	nodeVar1 = t;
	nodeVar2 = b;

	return select( nodeVar0, nodeVar1, nodeVar2 );

}


fn mx_negate_if ( val : f32, b : bool ) -> f32 {

	var nodeVar0 : bool;
	var nodeVar1 : f32;
	var nodeVar2 : f32;

	nodeVar0 = b;
	nodeVar1 = val;

	return select( nodeVar1, ( - nodeVar1 ), nodeVar0 );

}


fn mx_gradient_float_1 ( hash : u32, x : f32, y : f32, z : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;
	var nodeVar2 : f32;
	var nodeVar3 : u32;
	var nodeVar4 : u32;
	var nodeVar5 : f32;
	var nodeVar6 : f32;

	nodeVar0 = z;
	nodeVar1 = y;
	nodeVar2 = x;
	nodeVar3 = hash;
	nodeVar4 = ( nodeVar3 & 15u );
	nodeVar5 = mx_select( ( nodeVar4 < 8u ), nodeVar2, nodeVar1 );
	nodeVar6 = mx_select( ( nodeVar4 < 4u ), nodeVar1, mx_select( ( ( nodeVar4 == 12u ) || ( nodeVar4 == 14u ) ), nodeVar2, nodeVar0 ) );

	return ( mx_negate_if( nodeVar5, bool( ( nodeVar4 & 1u ) ) ) + mx_negate_if( nodeVar6, bool( ( nodeVar4 & 2u ) ) ) );

}


fn mx_trilerp_0 ( v0 : f32, v1 : f32, v2 : f32, v3 : f32, v4 : f32, v5 : f32, v6 : f32, v7 : f32, s : f32, t : f32, r : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;
	var nodeVar2 : f32;
	var nodeVar3 : f32;
	var nodeVar4 : f32;
	var nodeVar5 : f32;
	var nodeVar6 : f32;
	var nodeVar7 : f32;
	var nodeVar8 : f32;
	var nodeVar9 : f32;
	var nodeVar10 : f32;
	var nodeVar11 : f32;
	var nodeVar12 : f32;
	var nodeVar13 : f32;

	nodeVar0 = r;
	nodeVar1 = t;
	nodeVar2 = s;
	nodeVar3 = v7;
	nodeVar4 = v6;
	nodeVar5 = v5;
	nodeVar6 = v4;
	nodeVar7 = v3;
	nodeVar8 = v2;
	nodeVar9 = v1;
	nodeVar10 = v0;
	nodeVar11 = ( 1.0 - nodeVar2 );
	nodeVar12 = ( 1.0 - nodeVar1 );
	nodeVar13 = ( 1.0 - nodeVar0 );

	return ( ( nodeVar13 * ( ( nodeVar12 * ( ( nodeVar10 * nodeVar11 ) + ( nodeVar9 * nodeVar2 ) ) ) + ( nodeVar1 * ( ( nodeVar8 * nodeVar11 ) + ( nodeVar7 * nodeVar2 ) ) ) ) ) + ( nodeVar0 * ( ( nodeVar12 * ( ( nodeVar6 * nodeVar11 ) + ( nodeVar5 * nodeVar2 ) ) ) + ( nodeVar1 * ( ( nodeVar4 * nodeVar11 ) + ( nodeVar3 * nodeVar2 ) ) ) ) ) );

}


fn mx_gradient_scale3d_0 ( v : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = v;

	return ( 0.982 * nodeVar0 );

}


fn mx_perlin_noise_float_1 ( p : vec3<f32> ) -> f32 {

	var nodeVar0 : vec3<f32>;
	var nodeVar1 : i32;
	var nodeVar2 : i32;
	var nodeVar3 : i32;
	var nodeVar4 : f32;
	var nodeVar5 : f32;
	var nodeVar6 : f32;
	var nodeVar7 : f32;
	var nodeVar8 : f32;
	var nodeVar9 : f32;
	var nodeVar10 : f32;
	var nodeVar11 : f32;
	var nodeVar12 : f32;
	var nodeVar13 : f32;

	nodeVar0 = p;
	nodeVar1 = 0;
	nodeVar2 = 0;
	nodeVar3 = 0;
	nodeVar4 = nodeVar0.x;
	nodeVar1 = mx_floor( nodeVar4 );
	nodeVar5 = ( nodeVar4 - f32( nodeVar1 ) );
	nodeVar6 = nodeVar0.y;
	nodeVar2 = mx_floor( nodeVar6 );
	nodeVar7 = ( nodeVar6 - f32( nodeVar2 ) );
	nodeVar8 = nodeVar0.z;
	nodeVar3 = mx_floor( nodeVar8 );
	nodeVar9 = ( nodeVar8 - f32( nodeVar3 ) );
	nodeVar10 = mx_fade( nodeVar5 );
	nodeVar11 = mx_fade( nodeVar7 );
	nodeVar12 = mx_fade( nodeVar9 );
	nodeVar13 = mx_trilerp_0( mx_gradient_float_1( mx_hash_int_2( nodeVar1, nodeVar2, nodeVar3 ), nodeVar5, nodeVar7, nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), nodeVar2, nodeVar3 ), ( nodeVar5 - 1.0 ), nodeVar7, nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( nodeVar1, ( nodeVar2 + 1 ), nodeVar3 ), nodeVar5, ( nodeVar7 - 1.0 ), nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), ( nodeVar2 + 1 ), nodeVar3 ), ( nodeVar5 - 1.0 ), ( nodeVar7 - 1.0 ), nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( nodeVar1, nodeVar2, ( nodeVar3 + 1 ) ), nodeVar5, nodeVar7, ( nodeVar9 - 1.0 ) ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), nodeVar2, ( nodeVar3 + 1 ) ), ( nodeVar5 - 1.0 ), nodeVar7, ( nodeVar9 - 1.0 ) ), mx_gradient_float_1( mx_hash_int_2( nodeVar1, ( nodeVar2 + 1 ), ( nodeVar3 + 1 ) ), nodeVar5, ( nodeVar7 - 1.0 ), ( nodeVar9 - 1.0 ) ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), ( nodeVar2 + 1 ), ( nodeVar3 + 1 ) ), ( nodeVar5 - 1.0 ), ( nodeVar7 - 1.0 ), ( nodeVar9 - 1.0 ) ), nodeVar10, nodeVar11, nodeVar12 );

	return mx_gradient_scale3d_0( nodeVar13 );

}


fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 0.3 ) ) ) * 1.0 ) + 0.0 );
	nodeVar1 = ( ( ( ( v_positionWorld.y * 0.85 ) + ( nodeVar0 * 0.7 ) ) + ( v_positionWorld.x * 0.05 ) ) - ( v_positionWorld.z * 0.04 ) );
	nodeVar2 = floor( nodeVar1 );
	nodeVar3 = ( ( u32( ( nodeVar2 + 90.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar4 = ( ( ( nodeVar3 >> ( ( nodeVar3 >> 28u ) + 4u ) ) ^ nodeVar3 ) * 277803737u );
	nodeVar5 = ( ( u32( ( nodeVar2 + 91.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar6 = ( ( ( nodeVar5 >> ( ( nodeVar5 >> 28u ) + 4u ) ) ^ nodeVar5 ) * 277803737u );
	nodeVar7 = ( f32( ( ( nodeVar6 >> 22u ) ^ nodeVar6 ) ) * 2.3283064365386963e-10 );
	nodeVar8 = fwidth( nodeVar1 );
	nodeVar9 = min( max( ( nodeVar8 * 1.5 ), 0.16 ), 0.5 );
	nodeVar10 = fract( nodeVar1 );
	nodeVar11 = ( ( u32( ( nodeVar2 + 17.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar12 = ( ( ( nodeVar11 >> ( ( nodeVar11 >> 28u ) + 4u ) ) ^ nodeVar11 ) * 277803737u );
	nodeVar13 = ( f32( ( ( nodeVar12 >> 22u ) ^ nodeVar12 ) ) * 2.3283064365386963e-10 );
	nodeVar14 = ( ( ( ( ( v_positionWorld.x * 0.8 ) + ( v_positionWorld.z * 0.6 ) ) + ( nodeVar0 * 1.4 ) ) + ( nodeVar13 * 9.0 ) ) + ( ( nodeVar10 * ( nodeVar7 - 0.5 ) ) * 2.4 ) );
	nodeVar15 = ( ( nodeVar7 * 2.6 ) + 2.2 );
	nodeVar16 = ( nodeVar14 / nodeVar15 );
	nodeVar17 = ( ( u32( ( ( floor( nodeVar16 ) + ( nodeVar2 * 31.0 ) ) + 1000.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar18 = ( ( ( nodeVar17 >> ( ( nodeVar17 >> 28u ) + 4u ) ) ^ nodeVar17 ) * 277803737u );
	nodeVar19 = max( 0.12, ( fwidth( nodeVar14 ) * 1.5 ) );
	nodeVar20 = fract( nodeVar16 );
	nodeVar21 = ( min( nodeVar20, ( 1.0 - nodeVar20 ) ) * nodeVar15 );
	nodeVar22 = ( smoothstep( 0.0, nodeVar9, nodeVar10 ) * smoothstep( 1.0, ( 1.0 - nodeVar9 ), nodeVar10 ) );
	nodeVar23 = ( ( u32( ( nodeVar2 + 16.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar24 = ( ( ( nodeVar23 >> ( ( nodeVar23 >> 28u ) + 4u ) ) ^ nodeVar23 ) * 277803737u );
	nodeVar25 = ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 5.3 ) ) ) * 1.0 ) + 0.0 );
	nodeVar26 = max( 0.1, ( nodeVar8 * 1.5 ) );
	nodeVar27 = ( ( u32( ( nodeVar2 + 55.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar28 = ( ( ( nodeVar27 >> ( ( nodeVar27 >> 28u ) + 4u ) ) ^ nodeVar27 ) * 277803737u );
	nodeVar29 = ( ( u32( ( nodeVar2 + 44.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar30 = ( ( ( nodeVar29 >> ( ( nodeVar29 >> 28u ) + 4u ) ) ^ nodeVar29 ) * 277803737u );
	nodeVar31 = ( ( ( ( ( v_positionWorld.x * 0.8 ) + ( v_positionWorld.z * 0.6 ) ) + ( nodeVar0 * 0.35 ) ) + ( ( f32( ( ( nodeVar28 >> 22u ) ^ nodeVar28 ) ) * 2.3283064365386963e-10 ) * 13.0 ) ) + ( nodeVar10 * ( ( ( f32( ( ( nodeVar30 >> 22u ) ^ nodeVar30 ) ) * 2.3283064365386963e-10 ) - 0.5 ) * 0.6372 ) ) );
	nodeVar32 = fwidth( nodeVar31 );
	nodeVar33 = max( 0.025, ( nodeVar32 * 0.75 ) );
	nodeVar34 = ( ( u32( ( nodeVar2 + 33.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar35 = ( ( ( nodeVar34 >> ( ( nodeVar34 >> 28u ) + 4u ) ) ^ nodeVar34 ) * 277803737u );
	nodeVar36 = ( ( ( f32( ( ( nodeVar35 >> 22u ) ^ nodeVar35 ) ) * 2.3283064365386963e-10 ) * 2.0 ) + 1.3 );
	nodeVar37 = ( nodeVar31 / nodeVar36 );
	nodeVar38 = ( ( u32( ( nodeVar2 + 66.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar39 = ( ( ( nodeVar38 >> ( ( nodeVar38 >> 28u ) + 4u ) ) ^ nodeVar38 ) * 277803737u );
	nodeVar40 = ( ( u32( ( ( floor( nodeVar37 ) + ( nodeVar2 * 13.0 ) ) + 2000.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar41 = ( ( ( nodeVar40 >> ( ( nodeVar40 >> 28u ) + 4u ) ) ^ nodeVar40 ) * 277803737u );
	nodeVar42 = ( ( mix( vec3<f32>( 0.88, 0.94, 1.04 ), vec3<f32>( 1.04, 1.0, 0.92 ), mix( ( f32( ( ( nodeVar4 >> 22u ) ^ nodeVar4 ) ) * 2.3283064365386963e-10 ), nodeVar7, smoothstep( 0.0, nodeVar9, nodeVar10 ) ) ) * vec3<f32>( max( ( ( ( ( ( ( 0.7 + ( mix( 0.5, ( f32( ( ( nodeVar18 >> 22u ) ^ nodeVar18 ) ) * 2.3283064365386963e-10 ), ( smoothstep( 0.0, nodeVar19, nodeVar21 ) * nodeVar22 ) ) * 0.45 ) ) + ( mix( ( f32( ( ( nodeVar24 >> 22u ) ^ nodeVar24 ) ) * 2.3283064365386963e-10 ), nodeVar13, smoothstep( 0.0, nodeVar9, nodeVar10 ) ) * 0.2 ) ) + ( nodeVar0 * 0.18 ) ) + ( nodeVar25 * 0.1 ) ) - ( ( 1.0 - smoothstep( 0.5, 1.0, ( 1.0 - abs( ( ( mx_perlin_noise_float_1( ( ( v_positionWorld * vec3<f32>( 1.7, 1.0, 1.7 ) ) + vec3<f32>( 7.1, 0.0, 3.3 ) ) ) * 1.0 ) + 0.0 ) ) ) ) ) * 0.08 ) ) - ( smoothstep( 0.1, 0.7, ( ( mx_perlin_noise_float_1( vec3<f32>( ( v_positionWorld.x * 1.6 ), ( v_positionWorld.y * 0.22 ), ( v_positionWorld.z * 1.6 ) ) ) * 1.0 ) + 0.0 ) ) * 0.2 ) ), 0.12 ) ) ) * vec3<f32>( ( ( ( 1.0 - ( ( 1.0 - ( smoothstep( 0.0, nodeVar26, nodeVar10 ) * smoothstep( 1.0, ( 1.0 - nodeVar26 ), nodeVar10 ) ) ) * 0.35 ) ) * ( 1.0 - ( ( ( ( 1.0 - smoothstep( 0.02, nodeVar19, nodeVar21 ) ) * smoothstep( 0.3, 0.55, nodeVar13 ) ) * nodeVar22 ) * 0.4 ) ) ) * ( 1.0 - ( ( ( ( ( ( 1.0 - smoothstep( ( nodeVar33 - nodeVar32 ), ( nodeVar33 + nodeVar32 ), ( min( fract( nodeVar37 ), ( 1.0 - fract( nodeVar37 ) ) ) * nodeVar36 ) ) ) * min( 1.0, ( 0.05 / ( nodeVar32 * 1.5 ) ) ) ) * ( smoothstep( 0.35, 0.55, ( f32( ( ( nodeVar39 >> 22u ) ^ nodeVar39 ) ) * 2.3283064365386963e-10 ) ) * smoothstep( 0.4, 0.5, ( f32( ( ( nodeVar41 >> 22u ) ^ nodeVar41 ) ) * 2.3283064365386963e-10 ) ) ) ) * nodeVar22 ) * ( 1.0 - smoothstep( ( object.nodeUniform2 * 0.5 ), object.nodeUniform2, length( v_positionView ) ) ) ) * 0.45 ) ) ) ) );
	nodeVar43 = smoothstep( 0.2, 0.55, ( nodeVar0 + ( nodeVar25 * 0.5 ) ) );
	normalViewGeometry = normalize( v_normalViewGeometry );
	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	DiffuseColor = vec4<f32>( mix( ( vec3<f32>( 0.19, 0.18, 0.17 ) * mix( mix( nodeVar42, ( ( nodeVar42 * vec3<f32>( 0.82, 0.9, 1.0 ) ) * vec3<f32>( 0.82 ) ), ( 0.6 * 0.7 ) ), ( vec3<f32>( 0.82, 0.88, 0.72 ) * vec3<f32>( 0.8 ) ), min( ( ( ( ( ( ( smoothstep( 0.45, 0.75, nodeVar10 ) * smoothstep( 1.0, 0.9, nodeVar10 ) ) * nodeVar43 ) * ( 0.35 + smoothstep( 0.0, 0.5, normalWorld.y ) ) ) * nodeVar22 ) * 0.4 ) + ( ( 0.6 * nodeVar43 ) * 0.12 ) ), 0.45 ) ) ), vec3<f32>( 0.24, 0.215, 0.18 ), ( smoothstep( 0.55, 0.95, normalWorld.y ) * 0.35 ) ), 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform6 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform7;
	nodeVar44 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform8, 0.0525 ) + max( max( nodeVar44.x, nodeVar44.y ), nodeVar44.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform7 ) ) );
	EmissiveColor = ( object.nodeUniform9 * vec3<f32>( object.nodeUniform10 ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar45 = dot( normalView, positionViewDirection );
	nodeVar46 = textureSample( nodeUniform11, nodeUniform11_sampler, vec2<f32>( Roughness, clamp( nodeVar45, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar46;
	nodeVar47 = ( dfg.x + dfg.y );
	nodeVar48 = ( 1.0 / nodeVar47 );
	nodeVar49 = nodeVar48;
	nodeVar50 = ( nodeVar49 - 1.0 );
	nodeVar51 = ( SpecularColorBlended * vec3<f32>( nodeVar50 ) );
	nodeVar52 = ( nodeVar51 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar52;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar53 = dot( normalWorld, normalize( render.nodeUniform14 ) );
	nodeVar54 = ( nodeVar53 * 0.5 );
	nodeVar55 = ( nodeVar54 + 0.5 );
	nodeVar56 = mix( render.nodeUniform12, render.nodeUniform13, nodeVar55 );
	nodeVar57 = ( irradiance + nodeVar56 );
	irradiance = nodeVar57;
	nodeVar58 = ( render.nodeUniform15 - render.nodeUniform16 );
	nodeVar59 = vec4<f32>( nodeVar58, 0.0 );
	nodeVar60 = ( render.cameraViewMatrix * nodeVar59 );
	nodeVar61 = normalize( nodeVar60.xyz );
	nodeVar62 = nodeVar61;
	nodeVar63 = dot( normalView, nodeVar62 );
	nodeVar64 = ( vec3<f32>( clamp( nodeVar63, 0.0, 1.0 ) ) * render.nodeUniform17 );
	nodeVar65 = nodeVar64;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar66 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar67 = ( nodeVar65 * nodeVar66 );
	nodeVar68 = ( nodeVar62 + positionViewDirection );
	nodeVar69 = normalize( nodeVar68 );
	nodeVar70 = dot( positionViewDirection, nodeVar69 );
	nodeVar71 = clamp( nodeVar70, 0.0, 1.0 );
	nodeVar72 = exp2( ( ( ( nodeVar71 * -5.55473 ) - 6.98316 ) * nodeVar71 ) );
	nodeVar73 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar72 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar72 ) ) );
	nodeVar74 = ( vec3<f32>( 1.0 ) - nodeVar73 );
	nodeVar75 = nodeVar74;
	nodeVar76 = ( nodeVar67 * nodeVar75 );
	nodeVar77 = ( directDiffuse + nodeVar76 );
	directDiffuse = nodeVar77;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar78 = normalize( ( nodeVar62 + positionViewDirection ) );
	nodeVar79 = clamp( dot( positionViewDirection, nodeVar78 ), 0.0, 1.0 );
	nodeVar80 = exp2( ( ( ( nodeVar79 * -5.55473 ) - 6.98316 ) * nodeVar79 ) );
	nodeVar81 = ( Roughness * Roughness );
	nodeVar82 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar80 ) ) ) + vec3<f32>( ( 1.0 * nodeVar80 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar81, clamp( dot( normalView, nodeVar62 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar81, clamp( dot( normalView, nodeVar78 ), 0.0, 1.0 ) ) ) );
	nodeVar83 = ( nodeVar65 * nodeVar82 );
	nodeVar84 = ( nodeVar83 * multiScatteringCompensation );
	nodeVar85 = ( directSpecular + nodeVar84 );
	directSpecular = nodeVar85;
	nodeVar86 = ( render.nodeUniform18 - render.nodeUniform19 );
	nodeVar87 = vec4<f32>( nodeVar86, 0.0 );
	nodeVar88 = ( render.cameraViewMatrix * nodeVar87 );
	nodeVar89 = normalize( nodeVar88.xyz );
	nodeVar90 = nodeVar89;
	nodeVar91 = dot( normalView, nodeVar90 );
	shadowPositionWorld = v_positionWorld;
	nodeVar93 = ( render.nodeUniform21 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform22 ) ) ), 1.0 ) );
	nodeVar94 = ( nodeVar93.xyz / vec3<f32>( nodeVar93.w ) );
	nodeVar95 = vec3<f32>( nodeVar94.x, ( 1.0 - nodeVar94.y ), ( nodeVar94.z + render.nodeUniform23 ) );

	if ( ( ( ( ( ( nodeVar95.x >= 0.0 ) && ( nodeVar95.x <= 1.0 ) ) && ( nodeVar95.y >= 0.0 ) ) && ( nodeVar95.y <= 1.0 ) ) && ( nodeVar95.z <= 1.0 ) ) ) {

		nodeVar96 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar97 = ( render.nodeUniform25 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform26 ).x );
		nodeVar98 = ( nodeVar95.xy + ( vogelDiskSample( 0, 5, nodeVar96 ) * vec2<f32>( nodeVar97 ) ) );
		nodeVar99 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar98, nodeVar95.z );
		nodeVar100 = ( nodeVar95.xy + ( vogelDiskSample( 1, 5, nodeVar96 ) * vec2<f32>( nodeVar97 ) ) );
		nodeVar101 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar100, nodeVar95.z );
		nodeVar102 = ( nodeVar95.xy + ( vogelDiskSample( 2, 5, nodeVar96 ) * vec2<f32>( nodeVar97 ) ) );
		nodeVar103 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar102, nodeVar95.z );
		nodeVar104 = ( nodeVar95.xy + ( vogelDiskSample( 3, 5, nodeVar96 ) * vec2<f32>( nodeVar97 ) ) );
		nodeVar105 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar104, nodeVar95.z );
		nodeVar106 = ( nodeVar95.xy + ( vogelDiskSample( 4, 5, nodeVar96 ) * vec2<f32>( nodeVar97 ) ) );
		nodeVar107 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar106, nodeVar95.z );
		nodeVar92 = ( ( ( ( ( nodeVar99 + nodeVar101 ) + nodeVar103 ) + nodeVar105 ) + nodeVar107 ) * 0.2 );

	} else {

		nodeVar92 = 1.0;

	}

	nodeVar108 = mix( 1.0, nodeVar92, render.nodeUniform27 );
	nodeVar109 = ( vec3<f32>( clamp( nodeVar91, 0.0, 1.0 ) ) * ( render.nodeUniform20 * vec3<f32>( nodeVar108 ) ) );
	nodeVar110 = nodeVar109;
	nodeVar111 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar112 = ( nodeVar110 * nodeVar111 );
	nodeVar113 = ( nodeVar90 + positionViewDirection );
	nodeVar114 = normalize( nodeVar113 );
	nodeVar115 = dot( positionViewDirection, nodeVar114 );
	nodeVar116 = clamp( nodeVar115, 0.0, 1.0 );
	nodeVar117 = exp2( ( ( ( nodeVar116 * -5.55473 ) - 6.98316 ) * nodeVar116 ) );
	nodeVar118 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar117 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar117 ) ) );
	nodeVar119 = ( vec3<f32>( 1.0 ) - nodeVar118 );
	nodeVar120 = nodeVar119;
	nodeVar121 = ( nodeVar112 * nodeVar120 );
	nodeVar122 = ( directDiffuse + nodeVar121 );
	directDiffuse = nodeVar122;
	nodeVar123 = normalize( ( nodeVar90 + positionViewDirection ) );
	nodeVar124 = clamp( dot( positionViewDirection, nodeVar123 ), 0.0, 1.0 );
	nodeVar125 = exp2( ( ( ( nodeVar124 * -5.55473 ) - 6.98316 ) * nodeVar124 ) );
	nodeVar126 = ( Roughness * Roughness );
	nodeVar127 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar125 ) ) ) + vec3<f32>( ( 1.0 * nodeVar125 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar126, clamp( dot( normalView, nodeVar90 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar126, clamp( dot( normalView, nodeVar123 ), 0.0, 1.0 ) ) ) );
	nodeVar128 = ( nodeVar110 * nodeVar127 );
	nodeVar129 = ( nodeVar128 * multiScatteringCompensation );
	nodeVar130 = ( directSpecular + nodeVar129 );
	directSpecular = nodeVar130;
	nodeVar131 = ( render.nodeUniform28 - v_positionView );
	nodeVar132 = normalize( nodeVar131 );
	nodeVar133 = dot( normalView, nodeVar132 );

	if ( ( render.nodeUniform30 > 0.0 ) ) {

		nodeVar135 = length( nodeVar131 );
		nodeVar136 = ( nodeVar135 / render.nodeUniform30 );
		nodeVar137 = clamp( ( 1.0 - ( ( ( nodeVar136 * nodeVar136 ) * nodeVar136 ) * nodeVar136 ) ), 0.0, 1.0 );
		nodeVar134 = ( ( 1.0 / max( pow( nodeVar135, render.nodeUniform31 ), 0.01 ) ) * ( nodeVar137 * nodeVar137 ) );

	} else {

		nodeVar134 = ( 1.0 / max( pow( length( nodeVar131 ), render.nodeUniform31 ), 0.01 ) );

	}

	nodeVar138 = ( render.nodeUniform29 * vec3<f32>( nodeVar134 ) );
	nodeVar139 = ( vec3<f32>( clamp( nodeVar133, 0.0, 1.0 ) ) * nodeVar138 );
	nodeVar140 = nodeVar139;
	nodeVar141 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar142 = ( nodeVar140 * nodeVar141 );
	nodeVar143 = ( nodeVar132 + positionViewDirection );
	nodeVar144 = normalize( nodeVar143 );
	nodeVar145 = dot( positionViewDirection, nodeVar144 );
	nodeVar146 = clamp( nodeVar145, 0.0, 1.0 );
	nodeVar147 = exp2( ( ( ( nodeVar146 * -5.55473 ) - 6.98316 ) * nodeVar146 ) );
	nodeVar148 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar147 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar147 ) ) );
	nodeVar149 = ( vec3<f32>( 1.0 ) - nodeVar148 );
	nodeVar150 = nodeVar149;
	nodeVar151 = ( nodeVar142 * nodeVar150 );
	nodeVar152 = ( directDiffuse + nodeVar151 );
	directDiffuse = nodeVar152;
	nodeVar153 = normalize( ( nodeVar132 + positionViewDirection ) );
	nodeVar154 = clamp( dot( positionViewDirection, nodeVar153 ), 0.0, 1.0 );
	nodeVar155 = exp2( ( ( ( nodeVar154 * -5.55473 ) - 6.98316 ) * nodeVar154 ) );
	nodeVar156 = ( Roughness * Roughness );
	nodeVar157 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar155 ) ) ) + vec3<f32>( ( 1.0 * nodeVar155 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar156, clamp( dot( normalView, nodeVar132 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar156, clamp( dot( normalView, nodeVar153 ), 0.0, 1.0 ) ) ) );
	nodeVar158 = ( nodeVar140 * nodeVar157 );
	nodeVar159 = ( nodeVar158 * multiScatteringCompensation );
	nodeVar160 = ( directSpecular + nodeVar159 );
	directSpecular = nodeVar160;
	nodeVar161 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar162 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar163 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar164 = ( SpecularF90 * dfg.y );
	nodeVar165 = ( nodeVar163 + vec3<f32>( nodeVar164 ) );
	nodeVar166 = ( nodeVar161 + nodeVar165 );
	nodeVar161 = nodeVar166;
	nodeVar167 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar168 = nodeVar167;
	nodeVar169 = ( nodeVar168 * vec3<f32>( 0.047619 ) );
	nodeVar170 = ( SpecularColor + nodeVar169 );
	nodeVar171 = ( nodeVar165 * nodeVar170 );
	nodeVar172 = ( dfg.x + dfg.y );
	nodeVar173 = ( 1.0 - nodeVar172 );
	nodeVar174 = nodeVar173;
	nodeVar175 = ( vec3<f32>( nodeVar174 ) * nodeVar170 );
	nodeVar176 = ( vec3<f32>( 1.0 ) - nodeVar175 );
	nodeVar177 = nodeVar176;
	nodeVar178 = ( nodeVar171 / nodeVar177 );
	nodeVar179 = ( nodeVar178 * vec3<f32>( nodeVar174 ) );
	nodeVar180 = ( nodeVar162 + nodeVar179 );
	nodeVar162 = nodeVar180;
	nodeVar181 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar182 = ( irradiance * nodeVar181 );
	nodeVar183 = ( nodeVar161 + nodeVar162 );
	nodeVar184 = ( vec3<f32>( 1.0 ) - nodeVar183 );
	nodeVar185 = nodeVar184;
	nodeVar186 = ( nodeVar182 * nodeVar185 );
	nodeVar187 = nodeVar186;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar188 = ( indirectDiffuse + nodeVar187 );
	indirectDiffuse = nodeVar188;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar189 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar190 = ( SpecularF90 * dfg.y );
	nodeVar191 = ( nodeVar189 + vec3<f32>( nodeVar190 ) );
	nodeVar192 = ( singleScatteringDielectric + nodeVar191 );
	singleScatteringDielectric = nodeVar192;
	nodeVar193 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar194 = nodeVar193;
	nodeVar195 = ( nodeVar194 * vec3<f32>( 0.047619 ) );
	nodeVar196 = ( SpecularColor + nodeVar195 );
	nodeVar197 = ( nodeVar191 * nodeVar196 );
	nodeVar198 = ( dfg.x + dfg.y );
	nodeVar199 = ( 1.0 - nodeVar198 );
	nodeVar200 = nodeVar199;
	nodeVar201 = ( vec3<f32>( nodeVar200 ) * nodeVar196 );
	nodeVar202 = ( vec3<f32>( 1.0 ) - nodeVar201 );
	nodeVar203 = nodeVar202;
	nodeVar204 = ( nodeVar197 / nodeVar203 );
	nodeVar205 = ( nodeVar204 * vec3<f32>( nodeVar200 ) );
	nodeVar206 = ( multiScatteringDielectric + nodeVar205 );
	multiScatteringDielectric = nodeVar206;
	nodeVar207 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar208 = ( SpecularF90 * dfg.y );
	nodeVar209 = ( nodeVar207 + vec3<f32>( nodeVar208 ) );
	nodeVar210 = ( singleScatteringMetallic + nodeVar209 );
	singleScatteringMetallic = nodeVar210;
	nodeVar211 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar212 = nodeVar211;
	nodeVar213 = ( nodeVar212 * vec3<f32>( 0.047619 ) );
	nodeVar214 = ( DiffuseColor.xyz + nodeVar213 );
	nodeVar215 = ( nodeVar209 * nodeVar214 );
	nodeVar216 = ( dfg.x + dfg.y );
	nodeVar217 = ( 1.0 - nodeVar216 );
	nodeVar218 = nodeVar217;
	nodeVar219 = ( vec3<f32>( nodeVar218 ) * nodeVar214 );
	nodeVar220 = ( vec3<f32>( 1.0 ) - nodeVar219 );
	nodeVar221 = nodeVar220;
	nodeVar222 = ( nodeVar215 / nodeVar221 );
	nodeVar223 = ( nodeVar222 * vec3<f32>( nodeVar218 ) );
	nodeVar224 = ( multiScatteringMetallic + nodeVar223 );
	multiScatteringMetallic = nodeVar224;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar225 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar226 = ( radiance * nodeVar225 );
	nodeVar227 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar228 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar229 = ( nodeVar227 * nodeVar228 );
	nodeVar230 = ( nodeVar226 + nodeVar229 );
	nodeVar231 = nodeVar230;
	nodeVar232 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar233 = ( vec3<f32>( 1.0 ) - nodeVar232 );
	nodeVar234 = nodeVar233;
	nodeVar235 = ( DiffuseContribution * nodeVar234 );
	nodeVar236 = ( nodeVar235 * nodeVar228 );
	nodeVar237 = nodeVar236;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar238 = ( indirectSpecular + nodeVar231 );
	indirectSpecular = nodeVar238;
	nodeVar239 = ( indirectDiffuse + nodeVar237 );
	indirectDiffuse = nodeVar239;
	ambientOcclusion = 1.0;
	nodeVar240 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar240;
	nodeVar241 = dot( normalView, positionViewDirection );
	nodeVar242 = ( clamp( nodeVar241, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar243 = ( Roughness * -16.0 );
	nodeVar244 = ( 1.0 - nodeVar243 );
	nodeVar245 = nodeVar244;
	nodeVar246 = ( - nodeVar245 );
	nodeVar247 = exp2( nodeVar246 );
	nodeVar248 = pow( nodeVar242, nodeVar247 );
	nodeVar249 = ( 1.0 - nodeVar248 );
	nodeVar250 = nodeVar249;
	nodeVar251 = ( ambientOcclusion - nodeVar250 );
	nodeVar252 = ( indirectSpecular * vec3<f32>( clamp( nodeVar251, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar252;
	nodeVar253 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar253;
	nodeVar254 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar254;
	nodeVar255 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar255;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar256 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar257 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform32, object.nodeUniform33, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform35 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform36 * object.nodeUniform36 ) * nodeVar256 ) * nodeVar256 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar257;

	// result

	output.color = nodeVar257;

	return output;

}
