// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 1 ) @group( 1 ) var nodeUniform6_sampler : sampler;
@binding( 2 ) @group( 1 ) var nodeUniform6 : texture_2d<f32>;
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
	nodeUniform5 : f32,
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform8 : vec3<f32>,
	nodeUniform10 : vec3<f32>,
	nodeUniform7 : vec3<f32>,
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
var<private> nodeVar0 : vec2<f32>;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : u32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : u32;
var<private> nodeVar11 : u32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : f32;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : u32;
var<private> nodeVar21 : u32;
var<private> nodeVar22 : u32;
var<private> nodeVar23 : u32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : vec3<f32>;
var<private> nodeVar34 : vec3<f32>;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : u32;
var<private> nodeVar37 : u32;
var<private> nodeVar38 : u32;
var<private> nodeVar39 : u32;
var<private> nodeVar40 : f32;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : vec3<f32>;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar48 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : f32;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : f32;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : f32;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : f32;
var<private> Output : vec4<f32>;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar67 : vec3<f32>;
var<private> NORMAL_nodeVar68 : f32;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar71 : f32;
var<private> nodeVar72 : vec2<f32>;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : f32;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec4<f32>;
var<private> nodeVar86 : vec4<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : f32;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : f32;
var<private> nodeVar106 : f32;
var<private> nodeVar107 : f32;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec4<f32>;
var<private> nodeVar114 : vec4<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : vec4<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : f32;
var<private> nodeVar124 : vec2<f32>;
var<private> nodeVar125 : f32;
var<private> nodeVar126 : vec2<f32>;
var<private> nodeVar127 : f32;
var<private> nodeVar128 : vec2<f32>;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : vec2<f32>;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : vec2<f32>;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : f32;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : f32;
var<private> nodeVar142 : f32;
var<private> nodeVar143 : f32;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : f32;
var<private> nodeVar151 : f32;
var<private> nodeVar152 : f32;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : f32;
var<private> nodeVar160 : f32;
var<private> nodeVar161 : f32;
var<private> nodeVar162 : f32;
var<private> nodeVar163 : f32;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : f32;
var<private> nodeVar172 : f32;
var<private> nodeVar173 : f32;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : f32;
var<private> nodeVar181 : f32;
var<private> nodeVar182 : f32;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
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
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : f32;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : f32;
var<private> nodeVar225 : f32;
var<private> nodeVar226 : f32;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : f32;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : f32;
var<private> nodeVar243 : f32;
var<private> nodeVar244 : f32;
var<private> nodeVar245 : vec3<f32>;
var<private> nodeVar246 : vec3<f32>;
var<private> nodeVar247 : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> nodeVar255 : vec3<f32>;
var<private> nodeVar256 : vec3<f32>;
var<private> nodeVar257 : vec3<f32>;
var<private> nodeVar258 : vec3<f32>;
var<private> nodeVar259 : vec3<f32>;
var<private> nodeVar260 : vec3<f32>;
var<private> nodeVar261 : vec3<f32>;
var<private> nodeVar262 : vec3<f32>;
var<private> nodeVar263 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar264 : vec3<f32>;
var<private> nodeVar265 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar266 : vec3<f32>;
var<private> nodeVar267 : f32;
var<private> nodeVar268 : f32;
var<private> nodeVar269 : f32;
var<private> nodeVar270 : f32;
var<private> nodeVar271 : f32;
var<private> nodeVar272 : f32;
var<private> nodeVar273 : f32;
var<private> nodeVar274 : f32;
var<private> nodeVar275 : f32;
var<private> nodeVar276 : f32;
var<private> nodeVar277 : f32;
var<private> nodeVar278 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar279 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar280 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar281 : vec3<f32>;
var<private> nodeVar282 : f32;
var<private> nodeVar283 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }
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

	nodeVar0 = vec2<f32>( ( v_positionWorld.x - 122.0 ), ( v_positionWorld.z - 86.0 ) );
	nodeVar1 = length( nodeVar0 );
	nodeVar2 = ( nodeVar1 / 1.18 );
	nodeVar3 = floor( nodeVar2 );
	nodeVar4 = ( atan2( nodeVar0.y, nodeVar0.x ) / 6.283185307179586 );
	nodeVar5 = ( ( nodeVar3 + 0.5 ) * 1.18 );
	nodeVar6 = max( round( ( nodeVar5 * 3.9269908169872414 ) ), 6.0 );
	nodeVar7 = ( ( u32( ( nodeVar3 * 3.17 ) ) * 747796405u ) + 2891336453u );
	nodeVar8 = ( ( ( nodeVar7 >> ( ( nodeVar7 >> 28u ) + 4u ) ) ^ nodeVar7 ) * 277803737u );
	nodeVar9 = ( ( nodeVar4 * nodeVar6 ) + ( f32( ( ( nodeVar8 >> 22u ) ^ nodeVar8 ) ) * 2.3283064365386963e-10 ) );
	nodeVar10 = ( ( u32( ( ( nodeVar3 * 53.1 ) + tsl_mod_float( floor( nodeVar9 ), nodeVar6 ) ) ) * 747796405u ) + 2891336453u );
	nodeVar11 = ( ( ( nodeVar10 >> ( ( nodeVar10 >> 28u ) + 4u ) ) ^ nodeVar10 ) * 277803737u );
	nodeVar12 = ( f32( ( ( nodeVar11 >> 22u ) ^ nodeVar11 ) ) * 2.3283064365386963e-10 );
	nodeVar13 = length( vec2<f32>( ( v_positionWorld.x - 134.0 ), ( v_positionWorld.z - 86.0 ) ) );
	nodeVar14 = length( vec2<f32>( ( v_positionWorld.x - 122.0 ), ( v_positionWorld.z - 98.0 ) ) );
	nodeVar15 = length( vec2<f32>( ( v_positionWorld.x - 110.0 ), ( v_positionWorld.z - 86.0 ) ) );
	nodeVar16 = length( vec2<f32>( ( v_positionWorld.x - 122.0 ), ( v_positionWorld.z - 74.0 ) ) );
	nodeVar17 = ( max( max( ( smoothstep( 12.8, 16.0, nodeVar1 ) * 0.85 ), ( max( max( max( max( 0.0, ( 1.0 - smoothstep( 0.9, 2.4, nodeVar13 ) ) ), ( 1.0 - smoothstep( 0.9, 2.4, nodeVar14 ) ) ), ( 1.0 - smoothstep( 0.9, 2.4, nodeVar15 ) ) ), ( 1.0 - smoothstep( 0.9, 2.4, nodeVar16 ) ) ) * 0.7 ) ), ( ( 1.0 - smoothstep( 1.6, 3.0, nodeVar1 ) ) * 0.5 ) ) * mix( 0.7, 1.25, ( ( ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 0.33 ) ) ) * 1.0 ) + 0.0 ) * 0.5 ) + 0.5 ) ) );
	nodeVar18 = ( smoothstep( 0.0, 0.5, ( ( ( ( mx_perlin_noise_float_1( ( ( v_positionWorld * vec3<f32>( 2.4 ) ) + vec3<f32>( nodeVar12 ) ) ) * 1.0 ) + 0.0 ) + ( nodeVar17 * 0.9 ) ) - 0.15 ) ) * nodeVar17 );
	nodeVar19 = ( ( ( ( ( ( 1.0 * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar13 ) ) * 0.42 ) ) ) * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar14 ) ) * 0.42 ) ) ) * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar15 ) ) * 0.42 ) ) ) * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar16 ) ) * 0.42 ) ) ) * ( 1.0 - ( smoothstep( 14.6, 16.1, nodeVar1 ) * 0.48 ) ) ) * ( 1.0 - ( smoothstep( 0.34, 0.7, ( ( mx_perlin_noise_float_1( ( ( v_positionWorld * vec3<f32>( 0.16 ) ) + vec3<f32>( 2.2, 0.7, 6.1 ) ) ) * 1.0 ) + 0.0 ) ) * 0.4 ) ) );
	nodeVar20 = ( ( u32( ( nodeVar12 + 17.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar21 = ( ( ( nodeVar20 >> ( ( nodeVar20 >> 28u ) + 4u ) ) ^ nodeVar20 ) * 277803737u );
	nodeVar22 = ( ( u32( nodeVar12 ) * 747796405u ) + 2891336453u );
	nodeVar23 = ( ( ( nodeVar22 >> ( ( nodeVar22 >> 28u ) + 4u ) ) ^ nodeVar22 ) * 277803737u );
	nodeVar24 = ( ( ( ( mx_perlin_noise_float_1( ( ( v_positionWorld * vec3<f32>( 0.85 ) ) + vec3<f32>( ( nodeVar12 * 1.7 ) ) ) ) * 1.0 ) + 0.0 ) * 0.5 ) + 0.5 );
	nodeVar25 = fract( nodeVar2 );
	nodeVar26 = fract( nodeVar9 );
	nodeVar27 = min( ( min( nodeVar25, ( 1.0 - nodeVar25 ) ) * 1.18 ), ( min( nodeVar26, ( 1.0 - nodeVar26 ) ) * ( ( nodeVar5 * 6.283185307179586 ) / nodeVar6 ) ) );
	nodeVar28 = ( fwidth( nodeVar27 ) + 0.0015 );
	nodeVar29 = ( 1.0 - smoothstep( 0.012, 0.05, nodeVar28 ) );
	nodeVar30 = ( ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 23.0 ) ) ) * 1.0 ) + 0.0 ) * nodeVar29 );
	nodeVar31 = ( smoothstep( 0.52, 0.74, ( ( mx_perlin_noise_float_1( ( ( v_positionWorld * vec3<f32>( 8.1 ) ) + vec3<f32>( nodeVar12 ) ) ) * 1.0 ) + 0.0 ) ) * nodeVar29 );
	nodeVar32 = ( ( nodeVar27 + ( ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 9.5 ) ) ) * 1.0 ) + 0.0 ) * 0.014 ) ) + ( ( ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 31.0 ) ) ) * 1.0 ) + 0.0 ) * 0.005 ) * nodeVar29 ) );
	nodeVar33 = ( ( v_positionWorld * vec3<f32>( 2.6 ) ) + vec3<f32>( ( nodeVar12 * 3.1 ) ) );
	nodeVar34 = ( vec3<f32>( ( ( mx_perlin_noise_float_1( ( nodeVar33 * vec3<f32>( 2.9 ) ) ) * 1.0 ) + 0.0 ), ( ( mx_perlin_noise_float_1( ( ( nodeVar33 * vec3<f32>( 2.9 ) ) + vec3<f32>( 7.3 ) ) ) * 1.0 ) + 0.0 ), ( ( mx_perlin_noise_float_1( ( ( nodeVar33 * vec3<f32>( 2.9 ) ) + vec3<f32>( 13.1 ) ) ) * 1.0 ) + 0.0 ) ) * vec3<f32>( 0.4 ) );
	nodeVar35 = abs( ( ( mx_perlin_noise_float_1( ( nodeVar33 + nodeVar34 ) ) * 1.0 ) + 0.0 ) );
	nodeVar36 = ( ( u32( ( nodeVar12 + 3.7 ) ) * 747796405u ) + 2891336453u );
	nodeVar37 = ( ( ( nodeVar36 >> ( ( nodeVar36 >> 28u ) + 4u ) ) ^ nodeVar36 ) * 277803737u );
	nodeVar38 = ( ( u32( ( nodeVar12 + 9.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar39 = ( ( ( nodeVar38 >> ( ( nodeVar38 >> 28u ) + 4u ) ) ^ nodeVar38 ) * 277803737u );
	nodeVar40 = ( 0.02 + ( ( f32( ( ( nodeVar39 >> 22u ) ^ nodeVar39 ) ) * 2.3283064365386963e-10 ) * 0.012 ) );
	nodeVar41 = smoothstep( ( nodeVar40 - ( nodeVar28 * 0.9 ) ), ( nodeVar40 + ( nodeVar28 * 0.9 ) ), nodeVar32 );
	nodeVar42 = abs( ( ( mx_perlin_noise_float_1( ( ( ( v_positionWorld * vec3<f32>( 0.75 ) ) + ( nodeVar34 * vec3<f32>( 0.6 ) ) ) + vec3<f32>( 5.1, 1.3, 9.7 ) ) ) * 1.0 ) + 0.0 ) );
	nodeVar43 = max( ( ( ( 1.0 - smoothstep( 0.016, ( ( ( fwidth( nodeVar35 ) + 0.002 ) * 1.6 ) + 0.016 ), nodeVar35 ) ) * step( 0.725, ( f32( ( ( nodeVar37 >> 22u ) ^ nodeVar37 ) ) * 2.3283064365386963e-10 ) ) ) * nodeVar41 ), ( ( ( ( 1.0 - smoothstep( 0.012, ( 0.012 + ( ( fwidth( nodeVar42 ) + 0.0015 ) * 1.6 ) ), nodeVar42 ) ) * 0.55 ) * smoothstep( 0.12, 0.4, ( ( mx_perlin_noise_float_1( ( ( v_positionWorld * vec3<f32>( 0.13 ) ) + vec3<f32>( 1.9, 8.1, 3.3 ) ) ) * 1.0 ) + 0.0 ) ) ) * nodeVar41 ) );
	nodeVar44 = ( ( ( ( ( ( ( ( vec3<f32>( 0.215, 0.205, 0.192 ) * mix( vec3<f32>( 0.83, 0.92, 1.05 ), vec3<f32>( 1.07, 0.97, 0.8 ), ( f32( ( ( nodeVar21 >> 22u ) ^ nodeVar21 ) ) * 2.3283064365386963e-10 ) ) ) * vec3<f32>( ( 0.5 + ( ( f32( ( ( nodeVar23 >> 22u ) ^ nodeVar23 ) ) * 2.3283064365386963e-10 ) * 0.85 ) ) ) ) * vec3<f32>( mix( 0.74, 1.14, nodeVar24 ) ) ) * vec3<f32>( ( 1.0 + ( nodeVar30 * 0.15 ) ) ) ) * vec3<f32>( ( 1.0 - ( nodeVar31 * 0.3 ) ) ) ) * vec3<f32>( mix( 0.68, 1.0, smoothstep( 0.0, 0.17, nodeVar32 ) ) ) ) * vec3<f32>( ( 1.0 + ( ( smoothstep( 0.02, 0.05, nodeVar32 ) * ( 1.0 - smoothstep( 0.05, 0.11, nodeVar32 ) ) ) * 0.14 ) ) ) ) * vec3<f32>( ( 1.0 - ( nodeVar43 * 0.78 ) ) ) );
	nodeVar45 = mix( ( mix( vec3<f32>( 0.045, 0.041, 0.038 ), vec3<f32>( 0.07, 0.092, 0.04 ), ( nodeVar18 * 0.9 ) ) * vec3<f32>( nodeVar19 ) ), ( ( mix( nodeVar44, ( nodeVar44 * vec3<f32>( 0.62, 0.78, 0.5 ) ), ( nodeVar18 * 0.7 ) ) * vec3<f32>( ( 1.0 - ( nodeVar17 * 0.38 ) ) ) ) * vec3<f32>( nodeVar19 ) ), nodeVar41 );
	nodeVar46 = ( ( fwidth( nodeVar1 ) * 1.2 ) + 0.01 );
	nodeVar47 = mix( nodeVar45, ( nodeVar45 * vec3<f32>( 0.55 ) ), max( ( 1.0 - smoothstep( 0.07, ( 0.07 + nodeVar46 ), abs( ( nodeVar1 - 4.4 ) ) ) ), ( step( 0.84, fract( ( nodeVar4 * 36.0 ) ) ) * ( 1.0 - smoothstep( 0.16, ( nodeVar46 + 0.16 ), abs( ( nodeVar1 - 3.5 ) ) ) ) ) ) );
	DiffuseColor = vec4<f32>( nodeVar47, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform1 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform2;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar48 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( mix( 1.0, ( ( 0.93 - ( nodeVar24 * 0.1 ) ) + ( nodeVar18 * 0.07 ) ), nodeVar41 ), 0.0525 ) + max( max( nodeVar48.x, nodeVar48.y ), nodeVar48.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform2 ) ) );
	nodeVar49 = ( vec3<f32>( 115.88471875080587, 12.15, 71.23640507046963 ) - v_positionWorld );
	nodeVar50 = ( length( nodeVar49 ) / 4.4 );
	nodeVar51 = ( vec3<f32>( 128.11528124919414, 12.15, 71.23640507046964 ) - v_positionWorld );
	nodeVar52 = ( length( nodeVar51 ) / 4.4 );
	nodeVar53 = ( vec3<f32>( 136.76359492953037, 12.15, 79.88471875080587 ) - v_positionWorld );
	nodeVar54 = ( length( nodeVar53 ) / 4.4 );
	nodeVar55 = ( vec3<f32>( 136.76359492953037, 12.15, 92.11528124919414 ) - v_positionWorld );
	nodeVar56 = ( length( nodeVar55 ) / 4.4 );
	nodeVar57 = ( vec3<f32>( 128.11528124919414, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar58 = ( length( nodeVar57 ) / 4.4 );
	nodeVar59 = ( vec3<f32>( 115.88471875080586, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar60 = ( length( nodeVar59 ) / 4.4 );
	nodeVar61 = ( vec3<f32>( 107.23640507046963, 12.15, 92.11528124919413 ) - v_positionWorld );
	nodeVar62 = ( length( nodeVar61 ) / 4.4 );
	nodeVar63 = ( vec3<f32>( 107.23640507046963, 12.15, 79.88471875080586 ) - v_positionWorld );
	nodeVar64 = ( length( nodeVar63 ) / 4.4 );
	EmissiveColor = ( nodeVar47 * ( ( vec3<f32>( 1.0, 0.52, 0.2 ) * ( ( ( ( ( ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar50 * nodeVar50 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar49 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform5 * 9.3 ) + 0.0 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform5 * 17.1 ) + 0.0 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform5 * 29.0 ) + 0.0 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar52 * nodeVar52 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar51 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform5 * 9.3 ) + 2.399 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform5 * 17.1 ) + 4.0783 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform5 * 29.0 ) + 7.4369000000000005 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar54 * nodeVar54 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar53 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform5 * 9.3 ) + 4.798 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform5 * 17.1 ) + 8.1566 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform5 * 29.0 ) + 14.873800000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar56 * nodeVar56 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar55 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform5 * 9.3 ) + 7.197 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform5 * 17.1 ) + 12.2349 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform5 * 29.0 ) + 22.3107 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar58 * nodeVar58 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar57 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform5 * 9.3 ) + 9.596 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform5 * 17.1 ) + 16.3132 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform5 * 29.0 ) + 29.747600000000002 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar60 * nodeVar60 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar59 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform5 * 9.3 ) + 11.995000000000001 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform5 * 17.1 ) + 20.3915 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform5 * 29.0 ) + 37.18450000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar62 * nodeVar62 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar61 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform5 * 9.3 ) + 14.394 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform5 * 17.1 ) + 24.4698 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform5 * 29.0 ) + 44.6214 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar64 * nodeVar64 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar63 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform5 * 9.3 ) + 16.793 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform5 * 17.1 ) + 28.548099999999998 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform5 * 29.0 ) + 52.0583 ) ) * 0.03 ) ) ) ) ) ) * vec3<f32>( 2.1 ) ) );
	nodeVar65 = dpdx( v_positionView );
	nodeVar66 = - dpdy( v_positionView );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar67 = cross( nodeVar66, NORMAL_normalView );
	NORMAL_nodeVar68 = dot( nodeVar65, NORMAL_nodeVar67 );
	nodeVar69 = ( ( ( ( ( nodeVar41 * 0.014 ) - ( nodeVar31 * 0.004 ) ) - ( nodeVar43 * 0.006 ) ) + ( nodeVar30 * 0.0018 ) ) + ( ( ( mx_perlin_noise_float_1( ( ( v_positionWorld * vec3<f32>( 2.6 ) ) + vec3<f32>( nodeVar12 ) ) ) * 1.0 ) + 0.0 ) * 0.004 ) );
	nodeVar70 = ( vec3<f32>( sign( NORMAL_nodeVar68 ) ) * ( ( ( vec3<f32>( dpdx( nodeVar69 ) ) * NORMAL_nodeVar67 ) + ( vec3<f32>( - dpdy( nodeVar69 ) ) * cross( NORMAL_normalView, nodeVar65 ) ) ) * vec3<f32>( 1.0 ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar68 ) ) * NORMAL_normalView ) - nodeVar70 ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar71 = dot( normalView, positionViewDirection );
	nodeVar72 = textureSample( nodeUniform6, nodeUniform6_sampler, vec2<f32>( Roughness, clamp( nodeVar71, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar72;
	nodeVar73 = ( dfg.x + dfg.y );
	nodeVar74 = ( 1.0 / nodeVar73 );
	nodeVar75 = nodeVar74;
	nodeVar76 = ( nodeVar75 - 1.0 );
	nodeVar77 = ( SpecularColorBlended * vec3<f32>( nodeVar76 ) );
	nodeVar78 = ( nodeVar77 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar78;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar79 = dot( normalWorld, normalize( render.nodeUniform10 ) );
	nodeVar80 = ( nodeVar79 * 0.5 );
	nodeVar81 = ( nodeVar80 + 0.5 );
	nodeVar82 = mix( render.nodeUniform7, render.nodeUniform8, nodeVar81 );
	nodeVar83 = ( irradiance + nodeVar82 );
	irradiance = nodeVar83;
	nodeVar84 = ( render.nodeUniform11 - render.nodeUniform12 );
	nodeVar85 = vec4<f32>( nodeVar84, 0.0 );
	nodeVar86 = ( render.cameraViewMatrix * nodeVar85 );
	nodeVar87 = normalize( nodeVar86.xyz );
	nodeVar88 = nodeVar87;
	nodeVar89 = dot( normalView, nodeVar88 );
	nodeVar90 = ( vec3<f32>( clamp( nodeVar89, 0.0, 1.0 ) ) * render.nodeUniform13 );
	nodeVar91 = nodeVar90;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar92 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar93 = ( nodeVar91 * nodeVar92 );
	nodeVar94 = ( nodeVar88 + positionViewDirection );
	nodeVar95 = normalize( nodeVar94 );
	nodeVar96 = dot( positionViewDirection, nodeVar95 );
	nodeVar97 = clamp( nodeVar96, 0.0, 1.0 );
	nodeVar98 = exp2( ( ( ( nodeVar97 * -5.55473 ) - 6.98316 ) * nodeVar97 ) );
	nodeVar99 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar98 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar98 ) ) );
	nodeVar100 = ( vec3<f32>( 1.0 ) - nodeVar99 );
	nodeVar101 = nodeVar100;
	nodeVar102 = ( nodeVar93 * nodeVar101 );
	nodeVar103 = ( directDiffuse + nodeVar102 );
	directDiffuse = nodeVar103;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar104 = normalize( ( nodeVar88 + positionViewDirection ) );
	nodeVar105 = clamp( dot( positionViewDirection, nodeVar104 ), 0.0, 1.0 );
	nodeVar106 = exp2( ( ( ( nodeVar105 * -5.55473 ) - 6.98316 ) * nodeVar105 ) );
	nodeVar107 = ( Roughness * Roughness );
	nodeVar108 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar106 ) ) ) + vec3<f32>( ( 1.0 * nodeVar106 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar107, clamp( dot( normalView, nodeVar88 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar107, clamp( dot( normalView, nodeVar104 ), 0.0, 1.0 ) ) ) );
	nodeVar109 = ( nodeVar91 * nodeVar108 );
	nodeVar110 = ( nodeVar109 * multiScatteringCompensation );
	nodeVar111 = ( directSpecular + nodeVar110 );
	directSpecular = nodeVar111;
	nodeVar112 = ( render.nodeUniform14 - render.nodeUniform15 );
	nodeVar113 = vec4<f32>( nodeVar112, 0.0 );
	nodeVar114 = ( render.cameraViewMatrix * nodeVar113 );
	nodeVar115 = normalize( nodeVar114.xyz );
	nodeVar116 = nodeVar115;
	nodeVar117 = dot( normalView, nodeVar116 );
	shadowPositionWorld = v_positionWorld;
	nodeVar119 = ( render.nodeUniform17 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform18 ) ) ), 1.0 ) );
	nodeVar120 = ( nodeVar119.xyz / vec3<f32>( nodeVar119.w ) );
	nodeVar121 = vec3<f32>( nodeVar120.x, ( 1.0 - nodeVar120.y ), ( nodeVar120.z + render.nodeUniform19 ) );

	if ( ( ( ( ( ( nodeVar121.x >= 0.0 ) && ( nodeVar121.x <= 1.0 ) ) && ( nodeVar121.y >= 0.0 ) ) && ( nodeVar121.y <= 1.0 ) ) && ( nodeVar121.z <= 1.0 ) ) ) {

		nodeVar122 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar123 = ( render.nodeUniform21 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform22 ).x );
		nodeVar124 = ( nodeVar121.xy + ( vogelDiskSample( 0, 5, nodeVar122 ) * vec2<f32>( nodeVar123 ) ) );
		nodeVar125 = textureSampleCompare( nodeUniform20, nodeUniform20_sampler, nodeVar124, nodeVar121.z );
		nodeVar126 = ( nodeVar121.xy + ( vogelDiskSample( 1, 5, nodeVar122 ) * vec2<f32>( nodeVar123 ) ) );
		nodeVar127 = textureSampleCompare( nodeUniform20, nodeUniform20_sampler, nodeVar126, nodeVar121.z );
		nodeVar128 = ( nodeVar121.xy + ( vogelDiskSample( 2, 5, nodeVar122 ) * vec2<f32>( nodeVar123 ) ) );
		nodeVar129 = textureSampleCompare( nodeUniform20, nodeUniform20_sampler, nodeVar128, nodeVar121.z );
		nodeVar130 = ( nodeVar121.xy + ( vogelDiskSample( 3, 5, nodeVar122 ) * vec2<f32>( nodeVar123 ) ) );
		nodeVar131 = textureSampleCompare( nodeUniform20, nodeUniform20_sampler, nodeVar130, nodeVar121.z );
		nodeVar132 = ( nodeVar121.xy + ( vogelDiskSample( 4, 5, nodeVar122 ) * vec2<f32>( nodeVar123 ) ) );
		nodeVar133 = textureSampleCompare( nodeUniform20, nodeUniform20_sampler, nodeVar132, nodeVar121.z );
		nodeVar118 = ( ( ( ( ( nodeVar125 + nodeVar127 ) + nodeVar129 ) + nodeVar131 ) + nodeVar133 ) * 0.2 );

	} else {

		nodeVar118 = 1.0;

	}

	nodeVar134 = mix( 1.0, nodeVar118, render.nodeUniform23 );
	nodeVar135 = ( vec3<f32>( clamp( nodeVar117, 0.0, 1.0 ) ) * ( render.nodeUniform16 * vec3<f32>( nodeVar134 ) ) );
	nodeVar136 = nodeVar135;
	nodeVar137 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar138 = ( nodeVar136 * nodeVar137 );
	nodeVar139 = ( nodeVar116 + positionViewDirection );
	nodeVar140 = normalize( nodeVar139 );
	nodeVar141 = dot( positionViewDirection, nodeVar140 );
	nodeVar142 = clamp( nodeVar141, 0.0, 1.0 );
	nodeVar143 = exp2( ( ( ( nodeVar142 * -5.55473 ) - 6.98316 ) * nodeVar142 ) );
	nodeVar144 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar143 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar143 ) ) );
	nodeVar145 = ( vec3<f32>( 1.0 ) - nodeVar144 );
	nodeVar146 = nodeVar145;
	nodeVar147 = ( nodeVar138 * nodeVar146 );
	nodeVar148 = ( directDiffuse + nodeVar147 );
	directDiffuse = nodeVar148;
	nodeVar149 = normalize( ( nodeVar116 + positionViewDirection ) );
	nodeVar150 = clamp( dot( positionViewDirection, nodeVar149 ), 0.0, 1.0 );
	nodeVar151 = exp2( ( ( ( nodeVar150 * -5.55473 ) - 6.98316 ) * nodeVar150 ) );
	nodeVar152 = ( Roughness * Roughness );
	nodeVar153 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar151 ) ) ) + vec3<f32>( ( 1.0 * nodeVar151 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar152, clamp( dot( normalView, nodeVar116 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar152, clamp( dot( normalView, nodeVar149 ), 0.0, 1.0 ) ) ) );
	nodeVar154 = ( nodeVar136 * nodeVar153 );
	nodeVar155 = ( nodeVar154 * multiScatteringCompensation );
	nodeVar156 = ( directSpecular + nodeVar155 );
	directSpecular = nodeVar156;
	nodeVar157 = ( render.nodeUniform24 - v_positionView );
	nodeVar158 = normalize( nodeVar157 );
	nodeVar159 = dot( normalView, nodeVar158 );

	if ( ( render.nodeUniform26 > 0.0 ) ) {

		nodeVar161 = length( nodeVar157 );
		nodeVar162 = ( nodeVar161 / render.nodeUniform26 );
		nodeVar163 = clamp( ( 1.0 - ( ( ( nodeVar162 * nodeVar162 ) * nodeVar162 ) * nodeVar162 ) ), 0.0, 1.0 );
		nodeVar160 = ( ( 1.0 / max( pow( nodeVar161, render.nodeUniform27 ), 0.01 ) ) * ( nodeVar163 * nodeVar163 ) );

	} else {

		nodeVar160 = ( 1.0 / max( pow( length( nodeVar157 ), render.nodeUniform27 ), 0.01 ) );

	}

	nodeVar164 = ( render.nodeUniform25 * vec3<f32>( nodeVar160 ) );
	nodeVar165 = ( vec3<f32>( clamp( nodeVar159, 0.0, 1.0 ) ) * nodeVar164 );
	nodeVar166 = nodeVar165;
	nodeVar167 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar168 = ( nodeVar166 * nodeVar167 );
	nodeVar169 = ( nodeVar158 + positionViewDirection );
	nodeVar170 = normalize( nodeVar169 );
	nodeVar171 = dot( positionViewDirection, nodeVar170 );
	nodeVar172 = clamp( nodeVar171, 0.0, 1.0 );
	nodeVar173 = exp2( ( ( ( nodeVar172 * -5.55473 ) - 6.98316 ) * nodeVar172 ) );
	nodeVar174 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar173 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar173 ) ) );
	nodeVar175 = ( vec3<f32>( 1.0 ) - nodeVar174 );
	nodeVar176 = nodeVar175;
	nodeVar177 = ( nodeVar168 * nodeVar176 );
	nodeVar178 = ( directDiffuse + nodeVar177 );
	directDiffuse = nodeVar178;
	nodeVar179 = normalize( ( nodeVar158 + positionViewDirection ) );
	nodeVar180 = clamp( dot( positionViewDirection, nodeVar179 ), 0.0, 1.0 );
	nodeVar181 = exp2( ( ( ( nodeVar180 * -5.55473 ) - 6.98316 ) * nodeVar180 ) );
	nodeVar182 = ( Roughness * Roughness );
	nodeVar183 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar181 ) ) ) + vec3<f32>( ( 1.0 * nodeVar181 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar182, clamp( dot( normalView, nodeVar158 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar182, clamp( dot( normalView, nodeVar179 ), 0.0, 1.0 ) ) ) );
	nodeVar184 = ( nodeVar166 * nodeVar183 );
	nodeVar185 = ( nodeVar184 * multiScatteringCompensation );
	nodeVar186 = ( directSpecular + nodeVar185 );
	directSpecular = nodeVar186;
	nodeVar187 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar188 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar189 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar190 = ( SpecularF90 * dfg.y );
	nodeVar191 = ( nodeVar189 + vec3<f32>( nodeVar190 ) );
	nodeVar192 = ( nodeVar187 + nodeVar191 );
	nodeVar187 = nodeVar192;
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
	nodeVar206 = ( nodeVar188 + nodeVar205 );
	nodeVar188 = nodeVar206;
	nodeVar207 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar208 = ( irradiance * nodeVar207 );
	nodeVar209 = ( nodeVar187 + nodeVar188 );
	nodeVar210 = ( vec3<f32>( 1.0 ) - nodeVar209 );
	nodeVar211 = nodeVar210;
	nodeVar212 = ( nodeVar208 * nodeVar211 );
	nodeVar213 = nodeVar212;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar214 = ( indirectDiffuse + nodeVar213 );
	indirectDiffuse = nodeVar214;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar215 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar216 = ( SpecularF90 * dfg.y );
	nodeVar217 = ( nodeVar215 + vec3<f32>( nodeVar216 ) );
	nodeVar218 = ( singleScatteringDielectric + nodeVar217 );
	singleScatteringDielectric = nodeVar218;
	nodeVar219 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar220 = nodeVar219;
	nodeVar221 = ( nodeVar220 * vec3<f32>( 0.047619 ) );
	nodeVar222 = ( SpecularColor + nodeVar221 );
	nodeVar223 = ( nodeVar217 * nodeVar222 );
	nodeVar224 = ( dfg.x + dfg.y );
	nodeVar225 = ( 1.0 - nodeVar224 );
	nodeVar226 = nodeVar225;
	nodeVar227 = ( vec3<f32>( nodeVar226 ) * nodeVar222 );
	nodeVar228 = ( vec3<f32>( 1.0 ) - nodeVar227 );
	nodeVar229 = nodeVar228;
	nodeVar230 = ( nodeVar223 / nodeVar229 );
	nodeVar231 = ( nodeVar230 * vec3<f32>( nodeVar226 ) );
	nodeVar232 = ( multiScatteringDielectric + nodeVar231 );
	multiScatteringDielectric = nodeVar232;
	nodeVar233 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar234 = ( SpecularF90 * dfg.y );
	nodeVar235 = ( nodeVar233 + vec3<f32>( nodeVar234 ) );
	nodeVar236 = ( singleScatteringMetallic + nodeVar235 );
	singleScatteringMetallic = nodeVar236;
	nodeVar237 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar238 = nodeVar237;
	nodeVar239 = ( nodeVar238 * vec3<f32>( 0.047619 ) );
	nodeVar240 = ( DiffuseColor.xyz + nodeVar239 );
	nodeVar241 = ( nodeVar235 * nodeVar240 );
	nodeVar242 = ( dfg.x + dfg.y );
	nodeVar243 = ( 1.0 - nodeVar242 );
	nodeVar244 = nodeVar243;
	nodeVar245 = ( vec3<f32>( nodeVar244 ) * nodeVar240 );
	nodeVar246 = ( vec3<f32>( 1.0 ) - nodeVar245 );
	nodeVar247 = nodeVar246;
	nodeVar248 = ( nodeVar241 / nodeVar247 );
	nodeVar249 = ( nodeVar248 * vec3<f32>( nodeVar244 ) );
	nodeVar250 = ( multiScatteringMetallic + nodeVar249 );
	multiScatteringMetallic = nodeVar250;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar251 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar252 = ( radiance * nodeVar251 );
	nodeVar253 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar254 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar255 = ( nodeVar253 * nodeVar254 );
	nodeVar256 = ( nodeVar252 + nodeVar255 );
	nodeVar257 = nodeVar256;
	nodeVar258 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar259 = ( vec3<f32>( 1.0 ) - nodeVar258 );
	nodeVar260 = nodeVar259;
	nodeVar261 = ( DiffuseContribution * nodeVar260 );
	nodeVar262 = ( nodeVar261 * nodeVar254 );
	nodeVar263 = nodeVar262;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar264 = ( indirectSpecular + nodeVar257 );
	indirectSpecular = nodeVar264;
	nodeVar265 = ( indirectDiffuse + nodeVar263 );
	indirectDiffuse = nodeVar265;
	ambientOcclusion = 1.0;
	nodeVar266 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar266;
	nodeVar267 = dot( normalView, positionViewDirection );
	nodeVar268 = ( clamp( nodeVar267, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar269 = ( Roughness * -16.0 );
	nodeVar270 = ( 1.0 - nodeVar269 );
	nodeVar271 = nodeVar270;
	nodeVar272 = ( - nodeVar271 );
	nodeVar273 = exp2( nodeVar272 );
	nodeVar274 = pow( nodeVar268, nodeVar273 );
	nodeVar275 = ( 1.0 - nodeVar274 );
	nodeVar276 = nodeVar275;
	nodeVar277 = ( ambientOcclusion - nodeVar276 );
	nodeVar278 = ( indirectSpecular * vec3<f32>( clamp( nodeVar277, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar278;
	nodeVar279 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar279;
	nodeVar280 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar280;
	nodeVar281 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar281;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar282 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar283 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform28, object.nodeUniform29, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform31 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform32 * object.nodeUniform32 ) * nodeVar282 ) * nodeVar282 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar283;

	// result

	output.color = nodeVar283;

	return output;

}
