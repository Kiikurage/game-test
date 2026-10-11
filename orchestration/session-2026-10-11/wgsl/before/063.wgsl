// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 1 ) @group( 1 ) var nodeUniform10_sampler : sampler;
@binding( 2 ) @group( 1 ) var nodeUniform10 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform23_sampler : sampler_comparison;
@binding( 4 ) @group( 1 ) var nodeUniform23 : texture_depth_2d;

struct objectStruct {
	nodeUniform0 : mat4x4<f32>,
	nodeUniform1 : f32,
	nodeUniform3 : mat3x3<f32>,
	nodeUniform5 : f32,
	nodeUniform6 : f32,
	nodeUniform7 : f32,
	nodeUniform8 : vec3<f32>,
	nodeUniform9 : f32,
	nodeUniform31 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform34 : vec3<f32>,
	nodeUniform35 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform19 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform29 : f32,
	nodeUniform30 : f32,
	nodeUniform14 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform20 : mat4x4<f32>,
	nodeUniform21 : f32,
	nodeUniform22 : f32,
	nodeUniform26 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform24 : f32,
	nodeUniform25 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : u32;
var<private> nodeVar5 : u32;
var<private> nodeVar6 : u32;
var<private> nodeVar7 : u32;
var<private> nodeVar8 : f32;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : u32;
var<private> nodeVar13 : u32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : f32;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : u32;
var<private> nodeVar19 : u32;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : u32;
var<private> nodeVar26 : u32;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : u32;
var<private> nodeVar33 : u32;
var<private> nodeVar34 : u32;
var<private> nodeVar35 : u32;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : u32;
var<private> nodeVar40 : u32;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : u32;
var<private> nodeVar44 : u32;
var<private> nodeVar45 : u32;
var<private> nodeVar46 : u32;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> normalViewGeometry : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar51 : vec3<f32>;
var<private> NORMAL_nodeVar52 : f32;
var<private> NORMAL_normalWorld : vec3<f32>;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : u32;
var<private> nodeVar58 : u32;
var<private> nodeVar59 : f32;
var<private> nodeVar60 : f32;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : f32;
var<private> nodeVar63 : u32;
var<private> nodeVar64 : u32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> nodeVar65 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : vec2<f32>;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : f32;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec4<f32>;
var<private> nodeVar81 : vec4<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : f32;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : f32;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec4<f32>;
var<private> nodeVar109 : vec4<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar113 : f32;
var<private> nodeVar114 : vec4<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : f32;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : vec2<f32>;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : vec2<f32>;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : vec2<f32>;
var<private> nodeVar124 : f32;
var<private> nodeVar125 : vec2<f32>;
var<private> nodeVar126 : f32;
var<private> nodeVar127 : vec2<f32>;
var<private> nodeVar128 : f32;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : f32;
var<private> nodeVar137 : f32;
var<private> nodeVar138 : f32;
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
var<private> nodeVar157 : f32;
var<private> nodeVar158 : f32;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : f32;
var<private> nodeVar167 : f32;
var<private> nodeVar168 : f32;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : f32;
var<private> nodeVar176 : f32;
var<private> nodeVar177 : f32;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : f32;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : f32;
var<private> nodeVar194 : f32;
var<private> nodeVar195 : f32;
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
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : f32;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : f32;
var<private> nodeVar220 : f32;
var<private> nodeVar221 : f32;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : f32;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : f32;
var<private> nodeVar238 : f32;
var<private> nodeVar239 : f32;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> nodeVar243 : vec3<f32>;
var<private> nodeVar244 : vec3<f32>;
var<private> nodeVar245 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar246 : vec3<f32>;
var<private> nodeVar247 : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> nodeVar255 : vec3<f32>;
var<private> nodeVar256 : vec3<f32>;
var<private> nodeVar257 : vec3<f32>;
var<private> nodeVar258 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar259 : vec3<f32>;
var<private> nodeVar260 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar261 : vec3<f32>;
var<private> nodeVar262 : f32;
var<private> nodeVar263 : f32;
var<private> nodeVar264 : f32;
var<private> nodeVar265 : f32;
var<private> nodeVar266 : f32;
var<private> nodeVar267 : f32;
var<private> nodeVar268 : f32;
var<private> nodeVar269 : f32;
var<private> nodeVar270 : f32;
var<private> nodeVar271 : f32;
var<private> nodeVar272 : f32;
var<private> nodeVar273 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar274 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar275 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar276 : vec3<f32>;
var<private> nodeVar277 : f32;
var<private> nodeVar278 : vec4<f32>;

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
	@location( 6 ) nodeVarying9 : f32,
	@location( 7 ) nodeVarying10 : vec4<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = ( ( ( 0.84 + ( ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 0.55 ) ) ) * 1.0 ) + 0.0 ) * 0.26 ) ) + ( ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 2.6 ) ) ) * 1.0 ) + 0.0 ) * 0.16 ) ) + ( ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 11.0 ) ) ) * 1.0 ) + 0.0 ) * 0.1 ) );
	nodeVar1 = ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 0.3 ) ) ) * 1.0 ) + 0.0 );
	nodeVar2 = ( ( ( ( v_positionWorld.y * 0.85 ) + ( nodeVar1 * 0.7 ) ) + ( v_positionWorld.x * 0.05 ) ) - ( v_positionWorld.z * 0.04 ) );
	nodeVar3 = floor( nodeVar2 );
	nodeVar4 = ( ( u32( ( nodeVar3 + 90.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar5 = ( ( ( nodeVar4 >> ( ( nodeVar4 >> 28u ) + 4u ) ) ^ nodeVar4 ) * 277803737u );
	nodeVar6 = ( ( u32( ( nodeVar3 + 91.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar7 = ( ( ( nodeVar6 >> ( ( nodeVar6 >> 28u ) + 4u ) ) ^ nodeVar6 ) * 277803737u );
	nodeVar8 = ( f32( ( ( nodeVar7 >> 22u ) ^ nodeVar7 ) ) * 2.3283064365386963e-10 );
	nodeVar9 = fwidth( nodeVar2 );
	nodeVar10 = min( max( ( nodeVar9 * 1.5 ), 0.16 ), 0.5 );
	nodeVar11 = fract( nodeVar2 );
	nodeVar12 = ( ( u32( ( nodeVar3 + 17.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar13 = ( ( ( nodeVar12 >> ( ( nodeVar12 >> 28u ) + 4u ) ) ^ nodeVar12 ) * 277803737u );
	nodeVar14 = ( f32( ( ( nodeVar13 >> 22u ) ^ nodeVar13 ) ) * 2.3283064365386963e-10 );
	nodeVar15 = ( ( ( ( ( v_positionWorld.x * 0.8 ) + ( v_positionWorld.z * 0.6 ) ) + ( nodeVar1 * 1.4 ) ) + ( nodeVar14 * 9.0 ) ) + ( ( nodeVar11 * ( nodeVar8 - 0.5 ) ) * 2.4 ) );
	nodeVar16 = ( ( nodeVar8 * 2.6 ) + 2.2 );
	nodeVar17 = ( nodeVar15 / nodeVar16 );
	nodeVar18 = ( ( u32( ( ( floor( nodeVar17 ) + ( nodeVar3 * 31.0 ) ) + 1000.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar19 = ( ( ( nodeVar18 >> ( ( nodeVar18 >> 28u ) + 4u ) ) ^ nodeVar18 ) * 277803737u );
	nodeVar20 = max( 0.12, ( fwidth( nodeVar15 ) * 1.5 ) );
	nodeVar21 = fract( nodeVar17 );
	nodeVar22 = ( min( nodeVar21, ( 1.0 - nodeVar21 ) ) * nodeVar16 );
	nodeVar23 = ( smoothstep( 0.0, nodeVar10, nodeVar11 ) * smoothstep( 1.0, ( 1.0 - nodeVar10 ), nodeVar11 ) );
	nodeVar24 = mix( 0.5, ( f32( ( ( nodeVar19 >> 22u ) ^ nodeVar19 ) ) * 2.3283064365386963e-10 ), ( smoothstep( 0.0, nodeVar20, nodeVar22 ) * nodeVar23 ) );
	nodeVar25 = ( ( u32( ( nodeVar3 + 16.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar26 = ( ( ( nodeVar25 >> ( ( nodeVar25 >> 28u ) + 4u ) ) ^ nodeVar25 ) * 277803737u );
	nodeVar27 = mix( ( f32( ( ( nodeVar26 >> 22u ) ^ nodeVar26 ) ) * 2.3283064365386963e-10 ), nodeVar14, smoothstep( 0.0, nodeVar10, nodeVar11 ) );
	nodeVar28 = ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 5.3 ) ) ) * 1.0 ) + 0.0 );
	nodeVar29 = smoothstep( 0.5, 1.0, ( 1.0 - abs( ( ( mx_perlin_noise_float_1( ( ( v_positionWorld * vec3<f32>( 1.7, 1.0, 1.7 ) ) + vec3<f32>( 7.1, 0.0, 3.3 ) ) ) * 1.0 ) + 0.0 ) ) ) );
	nodeVar30 = max( 0.1, ( nodeVar9 * 1.5 ) );
	nodeVar31 = ( ( ( 1.0 - smoothstep( 0.02, nodeVar20, nodeVar22 ) ) * smoothstep( 0.3, 0.55, nodeVar14 ) ) * nodeVar23 );
	nodeVar32 = ( ( u32( ( nodeVar3 + 55.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar33 = ( ( ( nodeVar32 >> ( ( nodeVar32 >> 28u ) + 4u ) ) ^ nodeVar32 ) * 277803737u );
	nodeVar34 = ( ( u32( ( nodeVar3 + 44.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar35 = ( ( ( nodeVar34 >> ( ( nodeVar34 >> 28u ) + 4u ) ) ^ nodeVar34 ) * 277803737u );
	nodeVar36 = ( ( ( ( ( v_positionWorld.x * 0.8 ) + ( v_positionWorld.z * 0.6 ) ) + ( nodeVar1 * 0.35 ) ) + ( ( f32( ( ( nodeVar33 >> 22u ) ^ nodeVar33 ) ) * 2.3283064365386963e-10 ) * 13.0 ) ) + ( nodeVar11 * ( ( ( f32( ( ( nodeVar35 >> 22u ) ^ nodeVar35 ) ) * 2.3283064365386963e-10 ) - 0.5 ) * 0.6372 ) ) );
	nodeVar37 = fwidth( nodeVar36 );
	nodeVar38 = max( 0.025, ( nodeVar37 * 0.75 ) );
	nodeVar39 = ( ( u32( ( nodeVar3 + 33.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar40 = ( ( ( nodeVar39 >> ( ( nodeVar39 >> 28u ) + 4u ) ) ^ nodeVar39 ) * 277803737u );
	nodeVar41 = ( ( ( f32( ( ( nodeVar40 >> 22u ) ^ nodeVar40 ) ) * 2.3283064365386963e-10 ) * 2.0 ) + 1.3 );
	nodeVar42 = ( nodeVar36 / nodeVar41 );
	nodeVar43 = ( ( u32( ( nodeVar3 + 66.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar44 = ( ( ( nodeVar43 >> ( ( nodeVar43 >> 28u ) + 4u ) ) ^ nodeVar43 ) * 277803737u );
	nodeVar45 = ( ( u32( ( ( floor( nodeVar42 ) + ( nodeVar3 * 13.0 ) ) + 2000.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar46 = ( ( ( nodeVar45 >> ( ( nodeVar45 >> 28u ) + 4u ) ) ^ nodeVar45 ) * 277803737u );
	nodeVar47 = ( ( mix( vec3<f32>( 0.88, 0.94, 1.04 ), vec3<f32>( 1.04, 1.0, 0.92 ), mix( ( f32( ( ( nodeVar5 >> 22u ) ^ nodeVar5 ) ) * 2.3283064365386963e-10 ), nodeVar8, smoothstep( 0.0, nodeVar10, nodeVar11 ) ) ) * vec3<f32>( max( ( ( ( ( ( ( 0.7 + ( nodeVar24 * 0.45 ) ) + ( nodeVar27 * 0.2 ) ) + ( nodeVar1 * 0.18 ) ) + ( nodeVar28 * 0.1 ) ) - ( ( 1.0 - nodeVar29 ) * 0.08 ) ) - ( smoothstep( 0.1, 0.7, ( ( mx_perlin_noise_float_1( vec3<f32>( ( v_positionWorld.x * 1.6 ), ( v_positionWorld.y * 0.22 ), ( v_positionWorld.z * 1.6 ) ) ) * 1.0 ) + 0.0 ) ) * 0.2 ) ), 0.12 ) ) ) * vec3<f32>( ( ( ( 1.0 - ( ( 1.0 - ( smoothstep( 0.0, nodeVar30, nodeVar11 ) * smoothstep( 1.0, ( 1.0 - nodeVar30 ), nodeVar11 ) ) ) * 0.35 ) ) * ( 1.0 - ( nodeVar31 * 0.4 ) ) ) * ( 1.0 - ( ( ( ( ( ( 1.0 - smoothstep( ( nodeVar38 - nodeVar37 ), ( nodeVar38 + nodeVar37 ), ( min( fract( nodeVar42 ), ( 1.0 - fract( nodeVar42 ) ) ) * nodeVar41 ) ) ) * min( 1.0, ( 0.05 / ( nodeVar37 * 1.5 ) ) ) ) * ( smoothstep( 0.35, 0.55, ( f32( ( ( nodeVar44 >> 22u ) ^ nodeVar44 ) ) * 2.3283064365386963e-10 ) ) * smoothstep( 0.4, 0.5, ( f32( ( ( nodeVar46 >> 22u ) ^ nodeVar46 ) ) * 2.3283064365386963e-10 ) ) ) ) * nodeVar23 ) * ( 1.0 - smoothstep( ( object.nodeUniform1 * 0.5 ), object.nodeUniform1, length( v_positionView ) ) ) ) * 0.45 ) ) ) ) );
	nodeVar48 = smoothstep( 0.2, 0.55, ( nodeVar1 + ( nodeVar28 * 0.5 ) ) );
	nodeVar49 = dpdx( v_positionView );
	nodeVar50 = - dpdy( v_positionView );
	normalViewGeometry = normalize( v_normalViewGeometry );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar51 = cross( nodeVar50, NORMAL_normalView );
	NORMAL_nodeVar52 = dot( nodeVar49, NORMAL_nodeVar51 );
	NORMAL_normalWorld = normalize( ( vec4<f32>( NORMAL_normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar53 = smoothstep( 0.93, 0.74, NORMAL_normalWorld.y );
	nodeVar54 = ( ( ( ( ( ( ( ( smoothstep( 0.0, 0.3, nodeVar11 ) * smoothstep( 1.0, 0.7, nodeVar11 ) ) * 0.13 ) + ( nodeVar27 * 0.2 ) ) + ( ( smoothstep( 0.0, 0.45, nodeVar22 ) * nodeVar23 ) * ( ( nodeVar24 * 0.14 ) + 0.06 ) ) ) - ( nodeVar31 * 0.09 ) ) + ( nodeVar29 * 0.12 ) ) + ( nodeVar28 * 0.025 ) ) * ( nodeVar53 * 0.6 ) );
	nodeVar55 = ( vec3<f32>( sign( NORMAL_nodeVar52 ) ) * ( ( vec3<f32>( dpdx( nodeVar54 ) ) * NORMAL_nodeVar51 ) + ( vec3<f32>( - dpdy( nodeVar54 ) ) * cross( NORMAL_normalView, nodeVar49 ) ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar52 ) ) * NORMAL_normalView ) - nodeVar55 ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar56 = floor( ( v_positionWorld.xz.y / 0.68 ) );
	nodeVar57 = ( ( u32( nodeVar56 ) * 747796405u ) + 2891336453u );
	nodeVar58 = ( ( ( nodeVar57 >> ( ( nodeVar57 >> 28u ) + 4u ) ) ^ nodeVar57 ) * 277803737u );
	nodeVar59 = ( v_positionWorld.xz.x + ( ( f32( ( ( nodeVar58 >> 22u ) ^ nodeVar58 ) ) * 2.3283064365386963e-10 ) * 1.15 ) );
	nodeVar60 = fract( ( nodeVar59 / 1.15 ) );
	nodeVar61 = fract( ( v_positionWorld.xz.y / 0.68 ) );
	nodeVar62 = min( ( min( nodeVar60, ( 1.0 - nodeVar60 ) ) * 1.15 ), ( min( nodeVar61, ( 1.0 - nodeVar61 ) ) * 0.68 ) );
	nodeVar63 = ( ( u32( ( floor( ( nodeVar59 / 1.15 ) ) + ( nodeVar56 * 57.0 ) ) ) * 747796405u ) + 2891336453u );
	nodeVar64 = ( ( ( nodeVar63 >> ( ( nodeVar63 >> 28u ) + 4u ) ) ^ nodeVar63 ) * 277803737u );
	DiffuseColor = ( vec4<f32>( mix( ( vec3<f32>( ( ( nodeVar0 * ( ( ( 1.0 - ( ( smoothstep( 0.25, 0.6, nodeVarying7 ) * ( 1.0 - smoothstep( 0.6, 0.95, nodeVarying7 ) ) ) * 0.22 ) ) + ( ( smoothstep( 0.35, 0.6, ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 23.0 ) ) ) * 1.0 ) + 0.0 ) ) * nodeVarying7 ) * 0.45 ) ) - ( ( ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 5.5 ) ) ) * 1.0 ) + 0.0 ) * nodeVarying7 ) * 0.12 ) ) ) * ( 1.0 - ( ( smoothstep( 0.0, 0.3, nodeVarying7 ) * ( 1.0 - smoothstep( 0.3, 0.6, nodeVarying7 ) ) ) * 0.12 ) ) ) ) * mix( vec3<f32>( 1.0, 1.0, 1.0 ), mix( mix( nodeVar47, ( ( nodeVar47 * vec3<f32>( 0.82, 0.9, 1.0 ) ) * vec3<f32>( 0.82 ) ), ( nodeVarying8 * 0.7 ) ), ( vec3<f32>( 0.82, 0.88, 0.72 ) * vec3<f32>( 0.8 ) ), min( ( ( ( ( ( ( smoothstep( 0.45, 0.75, nodeVar11 ) * smoothstep( 1.0, 0.9, nodeVar11 ) ) * nodeVar48 ) * ( 0.35 + smoothstep( 0.0, 0.5, normalWorld.y ) ) ) * nodeVar23 ) * 0.4 ) + ( ( nodeVarying8 * nodeVar48 ) * 0.12 ) ), 0.45 ) ), nodeVar53 ) ), ( vec3<f32>( ( ( ( mix( 0.55, 1.0, smoothstep( 0.012, 0.06, nodeVar62 ) ) * ( ( ( f32( ( ( nodeVar64 >> 22u ) ^ nodeVar64 ) ) * 2.3283064365386963e-10 ) * 0.55 ) + 0.7 ) ) * ( ( smoothstep( 0.0, 0.2, nodeVar62 ) * 0.18 ) + 0.82 ) ) * ( ( nodeVar0 * 0.5 ) + 0.5 ) ) ) * vec3<f32>( 1.0, 1.0, 1.0 ) ), ( nodeVarying9 * smoothstep( -0.5, 0.2, ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 0.7 ) ) ) * 1.0 ) + 0.0 ) ) ) ), 1.0 ) * nodeVarying10 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform5 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform6;
	nodeVar65 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform7, 0.0525 ) + max( max( nodeVar65.x, nodeVar65.y ), nodeVar65.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform6 ) ) );
	EmissiveColor = ( object.nodeUniform8 * vec3<f32>( object.nodeUniform9 ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar66 = dot( normalView, positionViewDirection );
	nodeVar67 = textureSample( nodeUniform10, nodeUniform10_sampler, vec2<f32>( Roughness, clamp( nodeVar66, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar67;
	nodeVar68 = ( dfg.x + dfg.y );
	nodeVar69 = ( 1.0 / nodeVar68 );
	nodeVar70 = nodeVar69;
	nodeVar71 = ( nodeVar70 - 1.0 );
	nodeVar72 = ( SpecularColorBlended * vec3<f32>( nodeVar71 ) );
	nodeVar73 = ( nodeVar72 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar73;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar74 = dot( normalWorld, normalize( render.nodeUniform13 ) );
	nodeVar75 = ( nodeVar74 * 0.5 );
	nodeVar76 = ( nodeVar75 + 0.5 );
	nodeVar77 = mix( render.nodeUniform11, render.nodeUniform12, nodeVar76 );
	nodeVar78 = ( irradiance + nodeVar77 );
	irradiance = nodeVar78;
	nodeVar79 = ( render.nodeUniform14 - render.nodeUniform15 );
	nodeVar80 = vec4<f32>( nodeVar79, 0.0 );
	nodeVar81 = ( render.cameraViewMatrix * nodeVar80 );
	nodeVar82 = normalize( nodeVar81.xyz );
	nodeVar83 = nodeVar82;
	nodeVar84 = dot( normalView, nodeVar83 );
	nodeVar85 = ( vec3<f32>( clamp( nodeVar84, 0.0, 1.0 ) ) * render.nodeUniform16 );
	nodeVar86 = nodeVar85;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar87 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar88 = ( nodeVar86 * nodeVar87 );
	nodeVar89 = ( nodeVar83 + positionViewDirection );
	nodeVar90 = normalize( nodeVar89 );
	nodeVar91 = dot( positionViewDirection, nodeVar90 );
	nodeVar92 = clamp( nodeVar91, 0.0, 1.0 );
	nodeVar93 = exp2( ( ( ( nodeVar92 * -5.55473 ) - 6.98316 ) * nodeVar92 ) );
	nodeVar94 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar93 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar93 ) ) );
	nodeVar95 = ( vec3<f32>( 1.0 ) - nodeVar94 );
	nodeVar96 = nodeVar95;
	nodeVar97 = ( nodeVar88 * nodeVar96 );
	nodeVar98 = ( directDiffuse + nodeVar97 );
	directDiffuse = nodeVar98;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar99 = normalize( ( nodeVar83 + positionViewDirection ) );
	nodeVar100 = clamp( dot( positionViewDirection, nodeVar99 ), 0.0, 1.0 );
	nodeVar101 = exp2( ( ( ( nodeVar100 * -5.55473 ) - 6.98316 ) * nodeVar100 ) );
	nodeVar102 = ( Roughness * Roughness );
	nodeVar103 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar101 ) ) ) + vec3<f32>( ( 1.0 * nodeVar101 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar102, clamp( dot( normalView, nodeVar83 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar102, clamp( dot( normalView, nodeVar99 ), 0.0, 1.0 ) ) ) );
	nodeVar104 = ( nodeVar86 * nodeVar103 );
	nodeVar105 = ( nodeVar104 * multiScatteringCompensation );
	nodeVar106 = ( directSpecular + nodeVar105 );
	directSpecular = nodeVar106;
	nodeVar107 = ( render.nodeUniform17 - render.nodeUniform18 );
	nodeVar108 = vec4<f32>( nodeVar107, 0.0 );
	nodeVar109 = ( render.cameraViewMatrix * nodeVar108 );
	nodeVar110 = normalize( nodeVar109.xyz );
	nodeVar111 = nodeVar110;
	nodeVar112 = dot( normalView, nodeVar111 );
	shadowPositionWorld = v_positionWorld;
	nodeVar114 = ( render.nodeUniform20 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform21 ) ) ), 1.0 ) );
	nodeVar115 = ( nodeVar114.xyz / vec3<f32>( nodeVar114.w ) );
	nodeVar116 = vec3<f32>( nodeVar115.x, ( 1.0 - nodeVar115.y ), ( nodeVar115.z + render.nodeUniform22 ) );

	if ( ( ( ( ( ( nodeVar116.x >= 0.0 ) && ( nodeVar116.x <= 1.0 ) ) && ( nodeVar116.y >= 0.0 ) ) && ( nodeVar116.y <= 1.0 ) ) && ( nodeVar116.z <= 1.0 ) ) ) {

		nodeVar117 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar118 = ( render.nodeUniform24 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform25 ).x );
		nodeVar119 = ( nodeVar116.xy + ( vogelDiskSample( 0, 5, nodeVar117 ) * vec2<f32>( nodeVar118 ) ) );
		nodeVar120 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar119, nodeVar116.z );
		nodeVar121 = ( nodeVar116.xy + ( vogelDiskSample( 1, 5, nodeVar117 ) * vec2<f32>( nodeVar118 ) ) );
		nodeVar122 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar121, nodeVar116.z );
		nodeVar123 = ( nodeVar116.xy + ( vogelDiskSample( 2, 5, nodeVar117 ) * vec2<f32>( nodeVar118 ) ) );
		nodeVar124 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar123, nodeVar116.z );
		nodeVar125 = ( nodeVar116.xy + ( vogelDiskSample( 3, 5, nodeVar117 ) * vec2<f32>( nodeVar118 ) ) );
		nodeVar126 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar125, nodeVar116.z );
		nodeVar127 = ( nodeVar116.xy + ( vogelDiskSample( 4, 5, nodeVar117 ) * vec2<f32>( nodeVar118 ) ) );
		nodeVar128 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar127, nodeVar116.z );
		nodeVar113 = ( ( ( ( ( nodeVar120 + nodeVar122 ) + nodeVar124 ) + nodeVar126 ) + nodeVar128 ) * 0.2 );

	} else {

		nodeVar113 = 1.0;

	}

	nodeVar129 = mix( 1.0, nodeVar113, render.nodeUniform26 );
	nodeVar130 = ( vec3<f32>( clamp( nodeVar112, 0.0, 1.0 ) ) * ( render.nodeUniform19 * vec3<f32>( nodeVar129 ) ) );
	nodeVar131 = nodeVar130;
	nodeVar132 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar133 = ( nodeVar131 * nodeVar132 );
	nodeVar134 = ( nodeVar111 + positionViewDirection );
	nodeVar135 = normalize( nodeVar134 );
	nodeVar136 = dot( positionViewDirection, nodeVar135 );
	nodeVar137 = clamp( nodeVar136, 0.0, 1.0 );
	nodeVar138 = exp2( ( ( ( nodeVar137 * -5.55473 ) - 6.98316 ) * nodeVar137 ) );
	nodeVar139 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar138 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar138 ) ) );
	nodeVar140 = ( vec3<f32>( 1.0 ) - nodeVar139 );
	nodeVar141 = nodeVar140;
	nodeVar142 = ( nodeVar133 * nodeVar141 );
	nodeVar143 = ( directDiffuse + nodeVar142 );
	directDiffuse = nodeVar143;
	nodeVar144 = normalize( ( nodeVar111 + positionViewDirection ) );
	nodeVar145 = clamp( dot( positionViewDirection, nodeVar144 ), 0.0, 1.0 );
	nodeVar146 = exp2( ( ( ( nodeVar145 * -5.55473 ) - 6.98316 ) * nodeVar145 ) );
	nodeVar147 = ( Roughness * Roughness );
	nodeVar148 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar146 ) ) ) + vec3<f32>( ( 1.0 * nodeVar146 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar147, clamp( dot( normalView, nodeVar111 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar147, clamp( dot( normalView, nodeVar144 ), 0.0, 1.0 ) ) ) );
	nodeVar149 = ( nodeVar131 * nodeVar148 );
	nodeVar150 = ( nodeVar149 * multiScatteringCompensation );
	nodeVar151 = ( directSpecular + nodeVar150 );
	directSpecular = nodeVar151;
	nodeVar152 = ( render.nodeUniform27 - v_positionView );
	nodeVar153 = normalize( nodeVar152 );
	nodeVar154 = dot( normalView, nodeVar153 );

	if ( ( render.nodeUniform29 > 0.0 ) ) {

		nodeVar156 = length( nodeVar152 );
		nodeVar157 = ( nodeVar156 / render.nodeUniform29 );
		nodeVar158 = clamp( ( 1.0 - ( ( ( nodeVar157 * nodeVar157 ) * nodeVar157 ) * nodeVar157 ) ), 0.0, 1.0 );
		nodeVar155 = ( ( 1.0 / max( pow( nodeVar156, render.nodeUniform30 ), 0.01 ) ) * ( nodeVar158 * nodeVar158 ) );

	} else {

		nodeVar155 = ( 1.0 / max( pow( length( nodeVar152 ), render.nodeUniform30 ), 0.01 ) );

	}

	nodeVar159 = ( render.nodeUniform28 * vec3<f32>( nodeVar155 ) );
	nodeVar160 = ( vec3<f32>( clamp( nodeVar154, 0.0, 1.0 ) ) * nodeVar159 );
	nodeVar161 = nodeVar160;
	nodeVar162 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar163 = ( nodeVar161 * nodeVar162 );
	nodeVar164 = ( nodeVar153 + positionViewDirection );
	nodeVar165 = normalize( nodeVar164 );
	nodeVar166 = dot( positionViewDirection, nodeVar165 );
	nodeVar167 = clamp( nodeVar166, 0.0, 1.0 );
	nodeVar168 = exp2( ( ( ( nodeVar167 * -5.55473 ) - 6.98316 ) * nodeVar167 ) );
	nodeVar169 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar168 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar168 ) ) );
	nodeVar170 = ( vec3<f32>( 1.0 ) - nodeVar169 );
	nodeVar171 = nodeVar170;
	nodeVar172 = ( nodeVar163 * nodeVar171 );
	nodeVar173 = ( directDiffuse + nodeVar172 );
	directDiffuse = nodeVar173;
	nodeVar174 = normalize( ( nodeVar153 + positionViewDirection ) );
	nodeVar175 = clamp( dot( positionViewDirection, nodeVar174 ), 0.0, 1.0 );
	nodeVar176 = exp2( ( ( ( nodeVar175 * -5.55473 ) - 6.98316 ) * nodeVar175 ) );
	nodeVar177 = ( Roughness * Roughness );
	nodeVar178 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar176 ) ) ) + vec3<f32>( ( 1.0 * nodeVar176 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar177, clamp( dot( normalView, nodeVar153 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar177, clamp( dot( normalView, nodeVar174 ), 0.0, 1.0 ) ) ) );
	nodeVar179 = ( nodeVar161 * nodeVar178 );
	nodeVar180 = ( nodeVar179 * multiScatteringCompensation );
	nodeVar181 = ( directSpecular + nodeVar180 );
	directSpecular = nodeVar181;
	nodeVar182 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar183 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar184 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar185 = ( SpecularF90 * dfg.y );
	nodeVar186 = ( nodeVar184 + vec3<f32>( nodeVar185 ) );
	nodeVar187 = ( nodeVar182 + nodeVar186 );
	nodeVar182 = nodeVar187;
	nodeVar188 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar189 = nodeVar188;
	nodeVar190 = ( nodeVar189 * vec3<f32>( 0.047619 ) );
	nodeVar191 = ( SpecularColor + nodeVar190 );
	nodeVar192 = ( nodeVar186 * nodeVar191 );
	nodeVar193 = ( dfg.x + dfg.y );
	nodeVar194 = ( 1.0 - nodeVar193 );
	nodeVar195 = nodeVar194;
	nodeVar196 = ( vec3<f32>( nodeVar195 ) * nodeVar191 );
	nodeVar197 = ( vec3<f32>( 1.0 ) - nodeVar196 );
	nodeVar198 = nodeVar197;
	nodeVar199 = ( nodeVar192 / nodeVar198 );
	nodeVar200 = ( nodeVar199 * vec3<f32>( nodeVar195 ) );
	nodeVar201 = ( nodeVar183 + nodeVar200 );
	nodeVar183 = nodeVar201;
	nodeVar202 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar203 = ( irradiance * nodeVar202 );
	nodeVar204 = ( nodeVar182 + nodeVar183 );
	nodeVar205 = ( vec3<f32>( 1.0 ) - nodeVar204 );
	nodeVar206 = nodeVar205;
	nodeVar207 = ( nodeVar203 * nodeVar206 );
	nodeVar208 = nodeVar207;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar209 = ( indirectDiffuse + nodeVar208 );
	indirectDiffuse = nodeVar209;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar210 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar211 = ( SpecularF90 * dfg.y );
	nodeVar212 = ( nodeVar210 + vec3<f32>( nodeVar211 ) );
	nodeVar213 = ( singleScatteringDielectric + nodeVar212 );
	singleScatteringDielectric = nodeVar213;
	nodeVar214 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar215 = nodeVar214;
	nodeVar216 = ( nodeVar215 * vec3<f32>( 0.047619 ) );
	nodeVar217 = ( SpecularColor + nodeVar216 );
	nodeVar218 = ( nodeVar212 * nodeVar217 );
	nodeVar219 = ( dfg.x + dfg.y );
	nodeVar220 = ( 1.0 - nodeVar219 );
	nodeVar221 = nodeVar220;
	nodeVar222 = ( vec3<f32>( nodeVar221 ) * nodeVar217 );
	nodeVar223 = ( vec3<f32>( 1.0 ) - nodeVar222 );
	nodeVar224 = nodeVar223;
	nodeVar225 = ( nodeVar218 / nodeVar224 );
	nodeVar226 = ( nodeVar225 * vec3<f32>( nodeVar221 ) );
	nodeVar227 = ( multiScatteringDielectric + nodeVar226 );
	multiScatteringDielectric = nodeVar227;
	nodeVar228 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar229 = ( SpecularF90 * dfg.y );
	nodeVar230 = ( nodeVar228 + vec3<f32>( nodeVar229 ) );
	nodeVar231 = ( singleScatteringMetallic + nodeVar230 );
	singleScatteringMetallic = nodeVar231;
	nodeVar232 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar233 = nodeVar232;
	nodeVar234 = ( nodeVar233 * vec3<f32>( 0.047619 ) );
	nodeVar235 = ( DiffuseColor.xyz + nodeVar234 );
	nodeVar236 = ( nodeVar230 * nodeVar235 );
	nodeVar237 = ( dfg.x + dfg.y );
	nodeVar238 = ( 1.0 - nodeVar237 );
	nodeVar239 = nodeVar238;
	nodeVar240 = ( vec3<f32>( nodeVar239 ) * nodeVar235 );
	nodeVar241 = ( vec3<f32>( 1.0 ) - nodeVar240 );
	nodeVar242 = nodeVar241;
	nodeVar243 = ( nodeVar236 / nodeVar242 );
	nodeVar244 = ( nodeVar243 * vec3<f32>( nodeVar239 ) );
	nodeVar245 = ( multiScatteringMetallic + nodeVar244 );
	multiScatteringMetallic = nodeVar245;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar246 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar247 = ( radiance * nodeVar246 );
	nodeVar248 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar249 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar250 = ( nodeVar248 * nodeVar249 );
	nodeVar251 = ( nodeVar247 + nodeVar250 );
	nodeVar252 = nodeVar251;
	nodeVar253 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar254 = ( vec3<f32>( 1.0 ) - nodeVar253 );
	nodeVar255 = nodeVar254;
	nodeVar256 = ( DiffuseContribution * nodeVar255 );
	nodeVar257 = ( nodeVar256 * nodeVar249 );
	nodeVar258 = nodeVar257;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar259 = ( indirectSpecular + nodeVar252 );
	indirectSpecular = nodeVar259;
	nodeVar260 = ( indirectDiffuse + nodeVar258 );
	indirectDiffuse = nodeVar260;
	ambientOcclusion = 1.0;
	nodeVar261 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar261;
	nodeVar262 = dot( normalView, positionViewDirection );
	nodeVar263 = ( clamp( nodeVar262, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar264 = ( Roughness * -16.0 );
	nodeVar265 = ( 1.0 - nodeVar264 );
	nodeVar266 = nodeVar265;
	nodeVar267 = ( - nodeVar266 );
	nodeVar268 = exp2( nodeVar267 );
	nodeVar269 = pow( nodeVar263, nodeVar268 );
	nodeVar270 = ( 1.0 - nodeVar269 );
	nodeVar271 = nodeVar270;
	nodeVar272 = ( ambientOcclusion - nodeVar271 );
	nodeVar273 = ( indirectSpecular * vec3<f32>( clamp( nodeVar272, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar273;
	nodeVar274 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar274;
	nodeVar275 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar275;
	nodeVar276 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar276;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar277 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar278 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform31, object.nodeUniform32, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform34 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform35 * object.nodeUniform35 ) * nodeVar277 ) * nodeVar277 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar278;

	// result

	output.color = nodeVar278;

	return output;

}
