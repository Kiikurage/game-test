// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 1 ) @group( 1 ) var nodeUniform7_sampler : sampler;
@binding( 2 ) @group( 1 ) var nodeUniform7 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform20_sampler : sampler_comparison;
@binding( 4 ) @group( 1 ) var nodeUniform20 : texture_depth_2d;

struct objectStruct {
	nodeUniform0 : mat4x4<f32>,
	nodeUniform1 : f32,
	nodeUniform2 : f32,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform31 : vec3<f32>,
	nodeUniform32 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	nodeUniform6 : f32,
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform9 : vec3<f32>,
	nodeUniform10 : vec3<f32>,
	nodeUniform8 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform26 : f32,
	nodeUniform27 : f32,
	nodeUniform11 : vec3<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform24 : vec3<f32>,
	nodeUniform17 : mat4x4<f32>,
	nodeUniform18 : f32,
	nodeUniform19 : f32,
	nodeUniform23 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform21 : f32,
	nodeUniform22 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : u32;
var<private> nodeVar3 : u32;
var<private> nodeVar4 : u32;
var<private> nodeVar5 : u32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : u32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : u32;
var<private> nodeVar16 : u32;
var<private> nodeVar17 : u32;
var<private> nodeVar18 : u32;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : vec3<f32>;
var<private> nodeVar29 : vec3<f32>;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : u32;
var<private> nodeVar32 : u32;
var<private> nodeVar33 : u32;
var<private> nodeVar34 : u32;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : vec3<f32>;
var<private> nodeVar40 : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar46 : vec3<f32>;
var<private> NORMAL_nodeVar47 : f32;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : f32;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : f32;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : f32;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : vec2<f32>;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar72 : f32;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : vec4<f32>;
var<private> nodeVar79 : vec4<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : f32;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : f32;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec4<f32>;
var<private> nodeVar107 : vec4<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : vec4<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : f32;
var<private> nodeVar116 : f32;
var<private> nodeVar117 : vec2<f32>;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : vec2<f32>;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : vec2<f32>;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : vec2<f32>;
var<private> nodeVar124 : f32;
var<private> nodeVar125 : vec2<f32>;
var<private> nodeVar126 : f32;
var<private> nodeVar127 : f32;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : f32;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : f32;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : f32;
var<private> nodeVar144 : f32;
var<private> nodeVar145 : f32;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : f32;
var<private> nodeVar153 : f32;
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
var<private> nodeVar165 : f32;
var<private> nodeVar166 : f32;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : f32;
var<private> nodeVar174 : f32;
var<private> nodeVar175 : f32;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : f32;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : f32;
var<private> nodeVar192 : f32;
var<private> nodeVar193 : f32;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : f32;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : f32;
var<private> nodeVar218 : f32;
var<private> nodeVar219 : f32;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : f32;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : f32;
var<private> nodeVar236 : f32;
var<private> nodeVar237 : f32;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> nodeVar243 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar244 : vec3<f32>;
var<private> nodeVar245 : vec3<f32>;
var<private> nodeVar246 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar247 : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> nodeVar255 : vec3<f32>;
var<private> nodeVar256 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar257 : vec3<f32>;
var<private> nodeVar258 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar259 : vec3<f32>;
var<private> nodeVar260 : f32;
var<private> nodeVar261 : f32;
var<private> nodeVar262 : f32;
var<private> nodeVar263 : f32;
var<private> nodeVar264 : f32;
var<private> nodeVar265 : f32;
var<private> nodeVar266 : f32;
var<private> nodeVar267 : f32;
var<private> nodeVar268 : f32;
var<private> nodeVar269 : f32;
var<private> nodeVar270 : f32;
var<private> nodeVar271 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar272 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar273 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar274 : vec3<f32>;
var<private> nodeVar275 : f32;
var<private> nodeVar276 : vec4<f32>;

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
	@location( 4 ) nodeVarying7 : f32,
	@location( 5 ) nodeVarying8 : f32,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = ( nodeVarying7 / 0.3 );
	nodeVar1 = floor( nodeVar0 );
	nodeVar2 = ( ( u32( ( ( nodeVar1 * 1.9 ) + 13.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar3 = ( ( ( nodeVar2 >> ( ( nodeVar2 >> 28u ) + 4u ) ) ^ nodeVar2 ) * 277803737u );
	nodeVar4 = ( ( u32( ( nodeVar1 + 5.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar5 = ( ( ( nodeVar4 >> ( ( nodeVar4 >> 28u ) + 4u ) ) ^ nodeVar4 ) * 277803737u );
	nodeVar6 = ( 1.5 * ( ( ( f32( ( ( nodeVar5 >> 22u ) ^ nodeVar5 ) ) * 2.3283064365386963e-10 ) * 0.5 ) + 0.78 ) );
	nodeVar7 = ( ( nodeVarying8 + ( ( f32( ( ( nodeVar3 >> 22u ) ^ nodeVar3 ) ) * 2.3283064365386963e-10 ) * nodeVar6 ) ) / nodeVar6 );
	nodeVar8 = ( ( u32( ( ( nodeVar1 * 91.7 ) + floor( nodeVar7 ) ) ) * 747796405u ) + 2891336453u );
	nodeVar9 = ( ( ( nodeVar8 >> ( ( nodeVar8 >> 28u ) + 4u ) ) ^ nodeVar8 ) * 277803737u );
	nodeVar10 = ( f32( ( ( nodeVar9 >> 22u ) ^ nodeVar9 ) ) * 2.3283064365386963e-10 );
	nodeVar11 = ( v_positionWorld.y - 9.9 );
	nodeVar12 = ( max( ( ( 1.0 - smoothstep( 0.1, 1.5, nodeVar11 ) ) * 0.95 ), ( ( ( ( ( mx_perlin_noise_float_1( vec3<f32>( ( nodeVarying8 * 2.1 ), ( nodeVarying7 * 0.25 ), 3.3 ) ) * 1.0 ) + 0.0 ) * 0.5 ) + 0.5 ) * 0.38 ) ) * 0.8 );
	nodeVar13 = ( smoothstep( 0.0, 0.5, ( ( ( ( mx_perlin_noise_float_1( ( ( v_positionWorld * vec3<f32>( 2.4 ) ) + vec3<f32>( nodeVar10 ) ) ) * 1.0 ) + 0.0 ) + ( nodeVar12 * 0.9 ) ) - 0.15 ) ) * nodeVar12 );
	nodeVar14 = mix( 0.62, 1.0, smoothstep( 0.0, 0.7, nodeVar11 ) );
	nodeVar15 = ( ( u32( ( nodeVar10 + 17.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar16 = ( ( ( nodeVar15 >> ( ( nodeVar15 >> 28u ) + 4u ) ) ^ nodeVar15 ) * 277803737u );
	nodeVar17 = ( ( u32( nodeVar10 ) * 747796405u ) + 2891336453u );
	nodeVar18 = ( ( ( nodeVar17 >> ( ( nodeVar17 >> 28u ) + 4u ) ) ^ nodeVar17 ) * 277803737u );
	nodeVar19 = ( ( ( ( mx_perlin_noise_float_1( ( ( v_positionWorld * vec3<f32>( 0.85 ) ) + vec3<f32>( ( nodeVar10 * 1.7 ) ) ) ) * 1.0 ) + 0.0 ) * 0.5 ) + 0.5 );
	nodeVar20 = fract( nodeVar0 );
	nodeVar21 = fract( nodeVar7 );
	nodeVar22 = min( ( min( nodeVar20, ( 1.0 - nodeVar20 ) ) * 0.3 ), ( min( nodeVar21, ( 1.0 - nodeVar21 ) ) * nodeVar6 ) );
	nodeVar23 = ( fwidth( nodeVar22 ) + 0.0015 );
	nodeVar24 = ( 1.0 - smoothstep( 0.012, 0.05, nodeVar23 ) );
	nodeVar25 = ( ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 23.0 ) ) ) * 1.0 ) + 0.0 ) * nodeVar24 );
	nodeVar26 = ( smoothstep( 0.52, 0.74, ( ( mx_perlin_noise_float_1( ( ( v_positionWorld * vec3<f32>( 8.1 ) ) + vec3<f32>( nodeVar10 ) ) ) * 1.0 ) + 0.0 ) ) * nodeVar24 );
	nodeVar27 = ( ( nodeVar22 + ( ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 9.5 ) ) ) * 1.0 ) + 0.0 ) * 0.014 ) ) + ( ( ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 31.0 ) ) ) * 1.0 ) + 0.0 ) * 0.005 ) * nodeVar24 ) );
	nodeVar28 = ( ( v_positionWorld * vec3<f32>( 2.6 ) ) + vec3<f32>( ( nodeVar10 * 3.1 ) ) );
	nodeVar29 = ( vec3<f32>( ( ( mx_perlin_noise_float_1( ( nodeVar28 * vec3<f32>( 2.9 ) ) ) * 1.0 ) + 0.0 ), ( ( mx_perlin_noise_float_1( ( ( nodeVar28 * vec3<f32>( 2.9 ) ) + vec3<f32>( 7.3 ) ) ) * 1.0 ) + 0.0 ), ( ( mx_perlin_noise_float_1( ( ( nodeVar28 * vec3<f32>( 2.9 ) ) + vec3<f32>( 13.1 ) ) ) * 1.0 ) + 0.0 ) ) * vec3<f32>( 0.4 ) );
	nodeVar30 = abs( ( ( mx_perlin_noise_float_1( ( nodeVar28 + nodeVar29 ) ) * 1.0 ) + 0.0 ) );
	nodeVar31 = ( ( u32( ( nodeVar10 + 3.7 ) ) * 747796405u ) + 2891336453u );
	nodeVar32 = ( ( ( nodeVar31 >> ( ( nodeVar31 >> 28u ) + 4u ) ) ^ nodeVar31 ) * 277803737u );
	nodeVar33 = ( ( u32( ( nodeVar10 + 9.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar34 = ( ( ( nodeVar33 >> ( ( nodeVar33 >> 28u ) + 4u ) ) ^ nodeVar33 ) * 277803737u );
	nodeVar35 = ( 0.022 + ( ( f32( ( ( nodeVar34 >> 22u ) ^ nodeVar34 ) ) * 2.3283064365386963e-10 ) * 0.012 ) );
	nodeVar36 = smoothstep( ( nodeVar35 - ( nodeVar23 * 0.9 ) ), ( nodeVar35 + ( nodeVar23 * 0.9 ) ), nodeVar27 );
	nodeVar37 = abs( ( ( mx_perlin_noise_float_1( ( ( ( v_positionWorld * vec3<f32>( 0.75 ) ) + ( nodeVar29 * vec3<f32>( 0.6 ) ) ) + vec3<f32>( 5.1, 1.3, 9.7 ) ) ) * 1.0 ) + 0.0 ) );
	nodeVar38 = max( ( ( ( 1.0 - smoothstep( 0.016, ( ( ( fwidth( nodeVar30 ) + 0.002 ) * 1.6 ) + 0.016 ), nodeVar30 ) ) * step( 0.7525, ( f32( ( ( nodeVar32 >> 22u ) ^ nodeVar32 ) ) * 2.3283064365386963e-10 ) ) ) * nodeVar36 ), ( ( ( ( 1.0 - smoothstep( 0.012, ( 0.012 + ( ( fwidth( nodeVar37 ) + 0.0015 ) * 1.6 ) ), nodeVar37 ) ) * 0.0 ) * smoothstep( 0.12, 0.4, ( ( mx_perlin_noise_float_1( ( ( v_positionWorld * vec3<f32>( 0.13 ) ) + vec3<f32>( 1.9, 8.1, 3.3 ) ) ) * 1.0 ) + 0.0 ) ) ) * nodeVar36 ) );
	nodeVar39 = ( ( ( ( ( ( ( ( vec3<f32>( 0.215, 0.205, 0.192 ) * mix( vec3<f32>( 0.83, 0.92, 1.05 ), vec3<f32>( 1.07, 0.97, 0.8 ), ( f32( ( ( nodeVar16 >> 22u ) ^ nodeVar16 ) ) * 2.3283064365386963e-10 ) ) ) * vec3<f32>( ( 0.5 + ( ( f32( ( ( nodeVar18 >> 22u ) ^ nodeVar18 ) ) * 2.3283064365386963e-10 ) * 0.85 ) ) ) ) * vec3<f32>( mix( 0.74, 1.14, nodeVar19 ) ) ) * vec3<f32>( ( 1.0 + ( nodeVar25 * 0.15 ) ) ) ) * vec3<f32>( ( 1.0 - ( nodeVar26 * 0.3 ) ) ) ) * vec3<f32>( mix( 0.68, 1.0, smoothstep( 0.0, 0.17, nodeVar27 ) ) ) ) * vec3<f32>( ( 1.0 + ( ( smoothstep( 0.02, 0.05, nodeVar27 ) * ( 1.0 - smoothstep( 0.05, 0.11, nodeVar27 ) ) ) * 0.14 ) ) ) ) * vec3<f32>( ( 1.0 - ( nodeVar38 * 0.78 ) ) ) );
	nodeVar40 = mix( ( mix( vec3<f32>( 0.045, 0.041, 0.038 ), vec3<f32>( 0.07, 0.092, 0.04 ), ( nodeVar13 * 0.9 ) ) * vec3<f32>( nodeVar14 ) ), ( ( mix( nodeVar39, ( nodeVar39 * vec3<f32>( 0.62, 0.78, 0.5 ) ), ( nodeVar13 * 0.7 ) ) * vec3<f32>( ( 1.0 - ( nodeVar12 * 0.38 ) ) ) ) * vec3<f32>( nodeVar14 ) ), nodeVar36 );
	DiffuseColor = vec4<f32>( nodeVar40, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform1 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform2;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar41 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( mix( 1.0, ( ( 0.93 - ( nodeVar19 * 0.1 ) ) + ( nodeVar13 * 0.07 ) ), nodeVar36 ), 0.0525 ) + max( max( nodeVar41.x, nodeVar41.y ), nodeVar41.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform2 ) ) );
	nodeVar42 = ( vec3<f32>( 115.88471875080587, 12.15, 71.23640507046963 ) - v_positionWorld );
	nodeVar43 = ( length( nodeVar42 ) / 4.4 );
	nodeVar44 = dpdx( v_positionView );
	nodeVar45 = - dpdy( v_positionView );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar46 = cross( nodeVar45, NORMAL_normalView );
	NORMAL_nodeVar47 = dot( nodeVar44, NORMAL_nodeVar46 );
	nodeVar48 = ( ( ( ( ( nodeVar36 * 0.014 ) - ( nodeVar26 * 0.004 ) ) - ( nodeVar38 * 0.006 ) ) + ( nodeVar25 * 0.0018 ) ) + ( ( ( mx_perlin_noise_float_1( ( ( v_positionWorld * vec3<f32>( 2.6 ) ) + vec3<f32>( nodeVar10 ) ) ) * 1.0 ) + 0.0 ) * 0.004 ) );
	nodeVar49 = ( vec3<f32>( sign( NORMAL_nodeVar47 ) ) * ( ( ( vec3<f32>( dpdx( nodeVar48 ) ) * NORMAL_nodeVar46 ) + ( vec3<f32>( - dpdy( nodeVar48 ) ) * cross( NORMAL_normalView, nodeVar44 ) ) ) * vec3<f32>( 1.0 ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar47 ) ) * NORMAL_normalView ) - nodeVar49 ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar50 = ( vec3<f32>( 128.11528124919414, 12.15, 71.23640507046964 ) - v_positionWorld );
	nodeVar51 = ( length( nodeVar50 ) / 4.4 );
	nodeVar52 = ( vec3<f32>( 136.76359492953037, 12.15, 79.88471875080587 ) - v_positionWorld );
	nodeVar53 = ( length( nodeVar52 ) / 4.4 );
	nodeVar54 = ( vec3<f32>( 136.76359492953037, 12.15, 92.11528124919414 ) - v_positionWorld );
	nodeVar55 = ( length( nodeVar54 ) / 4.4 );
	nodeVar56 = ( vec3<f32>( 128.11528124919414, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar57 = ( length( nodeVar56 ) / 4.4 );
	nodeVar58 = ( vec3<f32>( 115.88471875080586, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar59 = ( length( nodeVar58 ) / 4.4 );
	nodeVar60 = ( vec3<f32>( 107.23640507046963, 12.15, 92.11528124919413 ) - v_positionWorld );
	nodeVar61 = ( length( nodeVar60 ) / 4.4 );
	nodeVar62 = ( vec3<f32>( 107.23640507046963, 12.15, 79.88471875080586 ) - v_positionWorld );
	nodeVar63 = ( length( nodeVar62 ) / 4.4 );
	EmissiveColor = ( nodeVar40 * ( ( vec3<f32>( 1.0, 0.52, 0.2 ) * ( ( ( ( ( ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar43 * nodeVar43 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar42 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 0.0 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 0.0 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 0.0 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar51 * nodeVar51 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar50 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 2.399 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 4.0783 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 7.4369000000000005 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar53 * nodeVar53 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar52 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 4.798 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 8.1566 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 14.873800000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar55 * nodeVar55 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar54 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 7.197 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 12.2349 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 22.3107 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar57 * nodeVar57 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar56 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 9.596 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 16.3132 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 29.747600000000002 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar59 * nodeVar59 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar58 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 11.995000000000001 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 20.3915 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 37.18450000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar61 * nodeVar61 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar60 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 14.394 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 24.4698 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 44.6214 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar63 * nodeVar63 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar62 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 16.793 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 28.548099999999998 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 52.0583 ) ) * 0.03 ) ) ) ) ) ) * vec3<f32>( 2.1 ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar64 = dot( normalView, positionViewDirection );
	nodeVar65 = textureSample( nodeUniform7, nodeUniform7_sampler, vec2<f32>( Roughness, clamp( nodeVar64, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar65;
	nodeVar66 = ( dfg.x + dfg.y );
	nodeVar67 = ( 1.0 / nodeVar66 );
	nodeVar68 = nodeVar67;
	nodeVar69 = ( nodeVar68 - 1.0 );
	nodeVar70 = ( SpecularColorBlended * vec3<f32>( nodeVar69 ) );
	nodeVar71 = ( nodeVar70 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar71;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar72 = dot( normalWorld, normalize( render.nodeUniform10 ) );
	nodeVar73 = ( nodeVar72 * 0.5 );
	nodeVar74 = ( nodeVar73 + 0.5 );
	nodeVar75 = mix( render.nodeUniform8, render.nodeUniform9, nodeVar74 );
	nodeVar76 = ( irradiance + nodeVar75 );
	irradiance = nodeVar76;
	nodeVar77 = ( render.nodeUniform11 - render.nodeUniform12 );
	nodeVar78 = vec4<f32>( nodeVar77, 0.0 );
	nodeVar79 = ( render.cameraViewMatrix * nodeVar78 );
	nodeVar80 = normalize( nodeVar79.xyz );
	nodeVar81 = nodeVar80;
	nodeVar82 = dot( normalView, nodeVar81 );
	nodeVar83 = ( vec3<f32>( clamp( nodeVar82, 0.0, 1.0 ) ) * render.nodeUniform13 );
	nodeVar84 = nodeVar83;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar85 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar86 = ( nodeVar84 * nodeVar85 );
	nodeVar87 = ( nodeVar81 + positionViewDirection );
	nodeVar88 = normalize( nodeVar87 );
	nodeVar89 = dot( positionViewDirection, nodeVar88 );
	nodeVar90 = clamp( nodeVar89, 0.0, 1.0 );
	nodeVar91 = exp2( ( ( ( nodeVar90 * -5.55473 ) - 6.98316 ) * nodeVar90 ) );
	nodeVar92 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar91 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar91 ) ) );
	nodeVar93 = ( vec3<f32>( 1.0 ) - nodeVar92 );
	nodeVar94 = nodeVar93;
	nodeVar95 = ( nodeVar86 * nodeVar94 );
	nodeVar96 = ( directDiffuse + nodeVar95 );
	directDiffuse = nodeVar96;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar97 = normalize( ( nodeVar81 + positionViewDirection ) );
	nodeVar98 = clamp( dot( positionViewDirection, nodeVar97 ), 0.0, 1.0 );
	nodeVar99 = exp2( ( ( ( nodeVar98 * -5.55473 ) - 6.98316 ) * nodeVar98 ) );
	nodeVar100 = ( Roughness * Roughness );
	nodeVar101 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar99 ) ) ) + vec3<f32>( ( 1.0 * nodeVar99 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar100, clamp( dot( normalView, nodeVar81 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar100, clamp( dot( normalView, nodeVar97 ), 0.0, 1.0 ) ) ) );
	nodeVar102 = ( nodeVar84 * nodeVar101 );
	nodeVar103 = ( nodeVar102 * multiScatteringCompensation );
	nodeVar104 = ( directSpecular + nodeVar103 );
	directSpecular = nodeVar104;
	nodeVar105 = ( render.nodeUniform14 - render.nodeUniform15 );
	nodeVar106 = vec4<f32>( nodeVar105, 0.0 );
	nodeVar107 = ( render.cameraViewMatrix * nodeVar106 );
	nodeVar108 = normalize( nodeVar107.xyz );
	nodeVar109 = nodeVar108;
	nodeVar110 = dot( normalView, nodeVar109 );
	shadowPositionWorld = v_positionWorld;
	nodeVar112 = ( render.nodeUniform17 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform18 ) ) ), 1.0 ) );
	nodeVar113 = ( nodeVar112.xyz / vec3<f32>( nodeVar112.w ) );
	nodeVar114 = vec3<f32>( nodeVar113.x, ( 1.0 - nodeVar113.y ), ( nodeVar113.z + render.nodeUniform19 ) );

	if ( ( ( ( ( ( nodeVar114.x >= 0.0 ) && ( nodeVar114.x <= 1.0 ) ) && ( nodeVar114.y >= 0.0 ) ) && ( nodeVar114.y <= 1.0 ) ) && ( nodeVar114.z <= 1.0 ) ) ) {

		nodeVar115 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar116 = ( render.nodeUniform21 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform22 ).x );
		nodeVar117 = ( nodeVar114.xy + ( vogelDiskSample( 0, 5, nodeVar115 ) * vec2<f32>( nodeVar116 ) ) );
		nodeVar118 = textureSampleCompare( nodeUniform20, nodeUniform20_sampler, nodeVar117, nodeVar114.z );
		nodeVar119 = ( nodeVar114.xy + ( vogelDiskSample( 1, 5, nodeVar115 ) * vec2<f32>( nodeVar116 ) ) );
		nodeVar120 = textureSampleCompare( nodeUniform20, nodeUniform20_sampler, nodeVar119, nodeVar114.z );
		nodeVar121 = ( nodeVar114.xy + ( vogelDiskSample( 2, 5, nodeVar115 ) * vec2<f32>( nodeVar116 ) ) );
		nodeVar122 = textureSampleCompare( nodeUniform20, nodeUniform20_sampler, nodeVar121, nodeVar114.z );
		nodeVar123 = ( nodeVar114.xy + ( vogelDiskSample( 3, 5, nodeVar115 ) * vec2<f32>( nodeVar116 ) ) );
		nodeVar124 = textureSampleCompare( nodeUniform20, nodeUniform20_sampler, nodeVar123, nodeVar114.z );
		nodeVar125 = ( nodeVar114.xy + ( vogelDiskSample( 4, 5, nodeVar115 ) * vec2<f32>( nodeVar116 ) ) );
		nodeVar126 = textureSampleCompare( nodeUniform20, nodeUniform20_sampler, nodeVar125, nodeVar114.z );
		nodeVar111 = ( ( ( ( ( nodeVar118 + nodeVar120 ) + nodeVar122 ) + nodeVar124 ) + nodeVar126 ) * 0.2 );

	} else {

		nodeVar111 = 1.0;

	}

	nodeVar127 = mix( 1.0, nodeVar111, render.nodeUniform23 );
	nodeVar128 = ( vec3<f32>( clamp( nodeVar110, 0.0, 1.0 ) ) * ( render.nodeUniform16 * vec3<f32>( nodeVar127 ) ) );
	nodeVar129 = nodeVar128;
	nodeVar130 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar131 = ( nodeVar129 * nodeVar130 );
	nodeVar132 = ( nodeVar109 + positionViewDirection );
	nodeVar133 = normalize( nodeVar132 );
	nodeVar134 = dot( positionViewDirection, nodeVar133 );
	nodeVar135 = clamp( nodeVar134, 0.0, 1.0 );
	nodeVar136 = exp2( ( ( ( nodeVar135 * -5.55473 ) - 6.98316 ) * nodeVar135 ) );
	nodeVar137 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar136 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar136 ) ) );
	nodeVar138 = ( vec3<f32>( 1.0 ) - nodeVar137 );
	nodeVar139 = nodeVar138;
	nodeVar140 = ( nodeVar131 * nodeVar139 );
	nodeVar141 = ( directDiffuse + nodeVar140 );
	directDiffuse = nodeVar141;
	nodeVar142 = normalize( ( nodeVar109 + positionViewDirection ) );
	nodeVar143 = clamp( dot( positionViewDirection, nodeVar142 ), 0.0, 1.0 );
	nodeVar144 = exp2( ( ( ( nodeVar143 * -5.55473 ) - 6.98316 ) * nodeVar143 ) );
	nodeVar145 = ( Roughness * Roughness );
	nodeVar146 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar144 ) ) ) + vec3<f32>( ( 1.0 * nodeVar144 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar145, clamp( dot( normalView, nodeVar109 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar145, clamp( dot( normalView, nodeVar142 ), 0.0, 1.0 ) ) ) );
	nodeVar147 = ( nodeVar129 * nodeVar146 );
	nodeVar148 = ( nodeVar147 * multiScatteringCompensation );
	nodeVar149 = ( directSpecular + nodeVar148 );
	directSpecular = nodeVar149;
	nodeVar150 = ( render.nodeUniform24 - v_positionView );
	nodeVar151 = normalize( nodeVar150 );
	nodeVar152 = dot( normalView, nodeVar151 );

	if ( ( render.nodeUniform26 > 0.0 ) ) {

		nodeVar154 = length( nodeVar150 );
		nodeVar155 = ( nodeVar154 / render.nodeUniform26 );
		nodeVar156 = clamp( ( 1.0 - ( ( ( nodeVar155 * nodeVar155 ) * nodeVar155 ) * nodeVar155 ) ), 0.0, 1.0 );
		nodeVar153 = ( ( 1.0 / max( pow( nodeVar154, render.nodeUniform27 ), 0.01 ) ) * ( nodeVar156 * nodeVar156 ) );

	} else {

		nodeVar153 = ( 1.0 / max( pow( length( nodeVar150 ), render.nodeUniform27 ), 0.01 ) );

	}

	nodeVar157 = ( render.nodeUniform25 * vec3<f32>( nodeVar153 ) );
	nodeVar158 = ( vec3<f32>( clamp( nodeVar152, 0.0, 1.0 ) ) * nodeVar157 );
	nodeVar159 = nodeVar158;
	nodeVar160 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar161 = ( nodeVar159 * nodeVar160 );
	nodeVar162 = ( nodeVar151 + positionViewDirection );
	nodeVar163 = normalize( nodeVar162 );
	nodeVar164 = dot( positionViewDirection, nodeVar163 );
	nodeVar165 = clamp( nodeVar164, 0.0, 1.0 );
	nodeVar166 = exp2( ( ( ( nodeVar165 * -5.55473 ) - 6.98316 ) * nodeVar165 ) );
	nodeVar167 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar166 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar166 ) ) );
	nodeVar168 = ( vec3<f32>( 1.0 ) - nodeVar167 );
	nodeVar169 = nodeVar168;
	nodeVar170 = ( nodeVar161 * nodeVar169 );
	nodeVar171 = ( directDiffuse + nodeVar170 );
	directDiffuse = nodeVar171;
	nodeVar172 = normalize( ( nodeVar151 + positionViewDirection ) );
	nodeVar173 = clamp( dot( positionViewDirection, nodeVar172 ), 0.0, 1.0 );
	nodeVar174 = exp2( ( ( ( nodeVar173 * -5.55473 ) - 6.98316 ) * nodeVar173 ) );
	nodeVar175 = ( Roughness * Roughness );
	nodeVar176 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar174 ) ) ) + vec3<f32>( ( 1.0 * nodeVar174 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar175, clamp( dot( normalView, nodeVar151 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar175, clamp( dot( normalView, nodeVar172 ), 0.0, 1.0 ) ) ) );
	nodeVar177 = ( nodeVar159 * nodeVar176 );
	nodeVar178 = ( nodeVar177 * multiScatteringCompensation );
	nodeVar179 = ( directSpecular + nodeVar178 );
	directSpecular = nodeVar179;
	nodeVar180 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar181 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar182 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar183 = ( SpecularF90 * dfg.y );
	nodeVar184 = ( nodeVar182 + vec3<f32>( nodeVar183 ) );
	nodeVar185 = ( nodeVar180 + nodeVar184 );
	nodeVar180 = nodeVar185;
	nodeVar186 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar187 = nodeVar186;
	nodeVar188 = ( nodeVar187 * vec3<f32>( 0.047619 ) );
	nodeVar189 = ( SpecularColor + nodeVar188 );
	nodeVar190 = ( nodeVar184 * nodeVar189 );
	nodeVar191 = ( dfg.x + dfg.y );
	nodeVar192 = ( 1.0 - nodeVar191 );
	nodeVar193 = nodeVar192;
	nodeVar194 = ( vec3<f32>( nodeVar193 ) * nodeVar189 );
	nodeVar195 = ( vec3<f32>( 1.0 ) - nodeVar194 );
	nodeVar196 = nodeVar195;
	nodeVar197 = ( nodeVar190 / nodeVar196 );
	nodeVar198 = ( nodeVar197 * vec3<f32>( nodeVar193 ) );
	nodeVar199 = ( nodeVar181 + nodeVar198 );
	nodeVar181 = nodeVar199;
	nodeVar200 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar201 = ( irradiance * nodeVar200 );
	nodeVar202 = ( nodeVar180 + nodeVar181 );
	nodeVar203 = ( vec3<f32>( 1.0 ) - nodeVar202 );
	nodeVar204 = nodeVar203;
	nodeVar205 = ( nodeVar201 * nodeVar204 );
	nodeVar206 = nodeVar205;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar207 = ( indirectDiffuse + nodeVar206 );
	indirectDiffuse = nodeVar207;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar208 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar209 = ( SpecularF90 * dfg.y );
	nodeVar210 = ( nodeVar208 + vec3<f32>( nodeVar209 ) );
	nodeVar211 = ( singleScatteringDielectric + nodeVar210 );
	singleScatteringDielectric = nodeVar211;
	nodeVar212 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar213 = nodeVar212;
	nodeVar214 = ( nodeVar213 * vec3<f32>( 0.047619 ) );
	nodeVar215 = ( SpecularColor + nodeVar214 );
	nodeVar216 = ( nodeVar210 * nodeVar215 );
	nodeVar217 = ( dfg.x + dfg.y );
	nodeVar218 = ( 1.0 - nodeVar217 );
	nodeVar219 = nodeVar218;
	nodeVar220 = ( vec3<f32>( nodeVar219 ) * nodeVar215 );
	nodeVar221 = ( vec3<f32>( 1.0 ) - nodeVar220 );
	nodeVar222 = nodeVar221;
	nodeVar223 = ( nodeVar216 / nodeVar222 );
	nodeVar224 = ( nodeVar223 * vec3<f32>( nodeVar219 ) );
	nodeVar225 = ( multiScatteringDielectric + nodeVar224 );
	multiScatteringDielectric = nodeVar225;
	nodeVar226 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar227 = ( SpecularF90 * dfg.y );
	nodeVar228 = ( nodeVar226 + vec3<f32>( nodeVar227 ) );
	nodeVar229 = ( singleScatteringMetallic + nodeVar228 );
	singleScatteringMetallic = nodeVar229;
	nodeVar230 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar231 = nodeVar230;
	nodeVar232 = ( nodeVar231 * vec3<f32>( 0.047619 ) );
	nodeVar233 = ( DiffuseColor.xyz + nodeVar232 );
	nodeVar234 = ( nodeVar228 * nodeVar233 );
	nodeVar235 = ( dfg.x + dfg.y );
	nodeVar236 = ( 1.0 - nodeVar235 );
	nodeVar237 = nodeVar236;
	nodeVar238 = ( vec3<f32>( nodeVar237 ) * nodeVar233 );
	nodeVar239 = ( vec3<f32>( 1.0 ) - nodeVar238 );
	nodeVar240 = nodeVar239;
	nodeVar241 = ( nodeVar234 / nodeVar240 );
	nodeVar242 = ( nodeVar241 * vec3<f32>( nodeVar237 ) );
	nodeVar243 = ( multiScatteringMetallic + nodeVar242 );
	multiScatteringMetallic = nodeVar243;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar244 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar245 = ( radiance * nodeVar244 );
	nodeVar246 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar247 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar248 = ( nodeVar246 * nodeVar247 );
	nodeVar249 = ( nodeVar245 + nodeVar248 );
	nodeVar250 = nodeVar249;
	nodeVar251 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar252 = ( vec3<f32>( 1.0 ) - nodeVar251 );
	nodeVar253 = nodeVar252;
	nodeVar254 = ( DiffuseContribution * nodeVar253 );
	nodeVar255 = ( nodeVar254 * nodeVar247 );
	nodeVar256 = nodeVar255;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar257 = ( indirectSpecular + nodeVar250 );
	indirectSpecular = nodeVar257;
	nodeVar258 = ( indirectDiffuse + nodeVar256 );
	indirectDiffuse = nodeVar258;
	ambientOcclusion = 1.0;
	nodeVar259 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar259;
	nodeVar260 = dot( normalView, positionViewDirection );
	nodeVar261 = ( clamp( nodeVar260, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar262 = ( Roughness * -16.0 );
	nodeVar263 = ( 1.0 - nodeVar262 );
	nodeVar264 = nodeVar263;
	nodeVar265 = ( - nodeVar264 );
	nodeVar266 = exp2( nodeVar265 );
	nodeVar267 = pow( nodeVar261, nodeVar266 );
	nodeVar268 = ( 1.0 - nodeVar267 );
	nodeVar269 = nodeVar268;
	nodeVar270 = ( ambientOcclusion - nodeVar269 );
	nodeVar271 = ( indirectSpecular * vec3<f32>( clamp( nodeVar270, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar271;
	nodeVar272 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar272;
	nodeVar273 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar273;
	nodeVar274 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar274;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar275 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar276 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform28, object.nodeUniform29, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform31 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform32 * object.nodeUniform32 ) * nodeVar275 ) * nodeVar275 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar276;

	// result

	output.color = nodeVar276;

	return output;

}
